import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { db, schema } from "@restai/db";
import { createInvoiceSchema, idParamSchema } from "@restai/validators";
import { authMiddleware } from "../middleware/auth.js";
import { tenantMiddleware, requireBranch } from "../middleware/tenant.js";
import { requirePermission } from "../middleware/rbac.js";

const invoices = new Hono<AppEnv>();

invoices.use("*", authMiddleware);
invoices.use("*", tenantMiddleware);
invoices.use("*", requireBranch);

// POST / - Create invoice
invoices.post(
  "/",
  requirePermission("invoices:create"),
  zValidator("json", createInvoiceSchema),
  async (c) => {
    const body = c.req.valid("json");
    const tenant = c.get("tenant") as any;

    // Validate document number based on type
    const docNumber = body.customerDocNumber;
    const docType = body.customerDocType;

    if (docType === "nid" && (docNumber.length !== 8 || !/^\d{8}$/.test(docNumber))) {
      return c.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Receipt Number must be 8 digits" } },
        400,
      );
    }
    if (docType === "tpin") {
      if (docNumber.length !== 11 || !/^\d{11}$/.test(docNumber)) {
        return c.json(
          { success: false, error: { code: "BAD_REQUEST", message: "TPIN must be 11 digits" } },
          400,
        );
      }
      if (!docNumber.startsWith("10") && !docNumber.startsWith("20")) {
        return c.json(
          { success: false, error: { code: "BAD_REQUEST", message: "TPIN must start with 10 or 20" } },
          400,
        );
      }
    }
    if (docType === "foreigner_id" && (docNumber.length < 9 || docNumber.length > 12)) {
      return c.json(
        { success: false, error: { code: "BAD_REQUEST", message: "CE must have between 9 and 12 characters" } },
        400,
      );
    }

    // Factura requires TPIN
    if (body.type === "invoice" && docType !== "tpin") {
      return c.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Invoice requires TPIN" } },
        400,
      );
    }

    // Get order
    const [order] = await db
      .select()
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.id, body.orderId),
          eq(schema.orders.branch_id, tenant.branchId),
        ),
      )
      .limit(1);

    if (!order) {
      return c.json(
        { success: false, error: { code: "NOT_FOUND", message: "Order not found" } },
        404,
      );
    }

    // Generate series/number + insert in a transaction with row locking
    const invoice = await db.transaction(async (tx) => {
      const prefix = body.type === "boleta" ? "B001" : "F001";

      const lastInvoice = await tx
        .select({ number: schema.invoices.number })
        .from(schema.invoices)
        .where(
          and(
            eq(schema.invoices.branch_id, tenant.branchId),
            eq(schema.invoices.series, prefix),
          ),
        )
        .orderBy(desc(schema.invoices.number))
        .limit(1)
        .for("update");

      const nextNumber = (lastInvoice[0]?.number || 0) + 1;

      const subtotal = Math.round(order.total / 1.18);
      const igv = order.total - subtotal;

      const [created] = await tx
        .insert(schema.invoices)
        .values({
          order_id: body.orderId,
          organization_id: tenant.organizationId,
          branch_id: tenant.branchId,
          type: body.type,
          series: prefix,
          number: nextNumber,
          customer_name: body.customerName,
          customer_doc_type: body.customerDocType,
          customer_doc_number: body.customerDocNumber,
          subtotal,
          igv,
          total: order.total,
          sunat_status: "pending",
        })
        .returning();

      return created;
    });

    return c.json({ success: true, data: invoice }, 201);
  },
);

// GET / - List invoices with optional filters
invoices.get("/", requirePermission("invoices:read"), async (c) => {
  const tenant = c.get("tenant") as any;
  const type = c.req.query("type");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");

  const conditions: any[] = [
    eq(schema.invoices.branch_id, tenant.branchId),
    eq(schema.invoices.organization_id, tenant.organizationId),
  ];

  if (type) {
    conditions.push(eq(schema.invoices.type, type as any));
  }
  if (startDate) {
    conditions.push(gte(schema.invoices.created_at, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(schema.invoices.created_at, new Date(endDate)));
  }

  const result = await db
    .select()
    .from(schema.invoices)
    .where(and(...conditions))
    .orderBy(desc(schema.invoices.created_at))
    .limit(100);

  return c.json({ success: true, data: result });
});

// GET /:id - Get invoice detail
invoices.get(
  "/:id",
  requirePermission("invoices:read"),
  zValidator("param", idParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const tenant = c.get("tenant") as any;

    const [invoice] = await db
      .select()
      .from(schema.invoices)
      .where(
        and(
          eq(schema.invoices.id, id),
          eq(schema.invoices.branch_id, tenant.branchId),
        ),
      )
      .limit(1);

    if (!invoice) {
      return c.json(
        { success: false, error: { code: "NOT_FOUND", message: "Receipt not found" } },
        404,
      );
    }

    return c.json({ success: true, data: invoice });
  },
);

export { invoices };
