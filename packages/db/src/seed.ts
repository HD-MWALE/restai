import { db, schema } from "./index";
import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  const [existingOrg] = await db
    .select({ id: schema.organizations.id })
    .from(schema.organizations)
    .where(eq(schema.organizations.slug, "demo"))
    .limit(1);

  if (existingOrg) {
    console.log("ℹ️ Seed was already executed previously (slug: demo).");
    console.log("   No changes were made to avoid duplicates.");
    process.exit(0);
  }

  // 1. Create organization
  const [org] = await db
    .insert(schema.organizations)
    .values({
      name: "Demo Restaurant",
      slug: "demo",
      plan: "pro",
      settings: { theme: "default" },
    })
    .returning();

  console.log(`✅ Organization: ${org.name} (${org.id})`);

  // 2. Create branch
  const [branch] = await db
    .insert(schema.branches)
    .values({
      organization_id: org.id,
      name: "Main Branch",
      slug: "principal",
      address: "Av. Javier Prado 1234, San Isidro, Lima",
      phone: "+51 1 234 5678",
      timezone: "America/Lima",
      currency: "PEN",
      tax_rate: 1800, // 18% IGV
      settings: {},
    })
    .returning();

  console.log(`✅ Branch: ${branch.name} (${branch.id})`);

  // 3. Create admin user
  const passwordHash = await hash("admin12345");

  const [admin] = await db
    .insert(schema.users)
    .values({
      organization_id: org.id,
      email: "admin@restai.pe",
      password_hash: passwordHash,
      name: "Admin Demo",
      role: "org_admin",
    })
    .returning();

  // Link admin to branch
  await db.insert(schema.userBranches).values({
    user_id: admin.id,
    branch_id: branch.id,
  });

  console.log(`✅ Admin: ${admin.email} (password: admin12345)`);

  // 4. Create staff users
  const staffData = [
    { email: "manager@restai.pe", name: "Maria Garcia", role: "branch_manager" as const, password: "gerente123" },
    { email: "cashier@restai.pe", name: "Carlos Lopez", role: "cashier" as const, password: "cajero1234" },
    { email: "mesero@restai.pe", name: "Juan Perez", role: "waiter" as const, password: "mesero1234" },
    { email: "kitchen@restai.pe", name: "Rosa Martinez", role: "kitchen" as const, password: "cocina1234" },
  ];

  for (const s of staffData) {
    const ph = await hash(s.password);
    const [user] = await db
      .insert(schema.users)
      .values({
        organization_id: org.id,
        email: s.email,
        password_hash: ph,
        name: s.name,
        role: s.role,
      })
      .returning();

    await db.insert(schema.userBranches).values({
      user_id: user.id,
      branch_id: branch.id,
    });

    console.log(`✅ Staff: ${s.email} (${s.role}, password: ${s.password})`);
  }

  // 5. Create menu categories
  const categories = [
    { name: "Entradas", description: "Para compartir", sort_order: 1 },
    { name: "Platos de Fondo", description: "Nuestras especialidades", sort_order: 2 },
    { name: "Ceviches", description: "Frescos del día", sort_order: 3 },
    { name: "Bebidas", description: "Refrescantes", sort_order: 4 },
    { name: "Postres", description: "Para endulzar", sort_order: 5 },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const [c] = await db
      .insert(schema.menuCategories)
      .values({
        branch_id: branch.id,
        organization_id: org.id,
        ...cat,
      })
      .returning();
    createdCategories.push(c);
  }

  console.log(`✅ ${createdCategories.length} categorías creadas`);

  // 6. Create menu items (prices in cents - Soles)
  const menuItems = [
    // Entradas
    { categoryIdx: 0, name: "Tequeños de Lomo Saltado", price: 2500, prep: 10, desc: "6 unidades con salsa criolla" },
    { categoryIdx: 0, name: "Papa a la Huancaína", price: 1800, prep: 8, desc: "Clásica receta peruana" },
    { categoryIdx: 0, name: "Causa Limeña", price: 2200, prep: 10, desc: "Rellena de pollo" },
    // Platos de Fondo
    { categoryIdx: 1, name: "Lomo Saltado", price: 3800, prep: 20, desc: "Con papas fritas y arroz" },
    { categoryIdx: 1, name: "Ají de Gallina", price: 3200, prep: 18, desc: "Cremoso y tradicional" },
    { categoryIdx: 1, name: "Arroz con Mariscos", price: 4200, prep: 25, desc: "Mixto de mariscos" },
    { categoryIdx: 1, name: "Seco de Res", price: 3500, prep: 20, desc: "Con frejoles y arroz" },
    // Ceviches
    { categoryIdx: 2, name: "Ceviche Clásico", price: 3500, prep: 12, desc: "Pescado fresco del día" },
    { categoryIdx: 2, name: "Ceviche Mixto", price: 4500, prep: 15, desc: "Pescado, pulpo, camarón y calamar" },
    { categoryIdx: 2, name: "Tiradito Nikkei", price: 3800, prep: 10, desc: "En salsa de maracuyá" },
    // Bebidas
    { categoryIdx: 3, name: "Chicha Morada", price: 800, prep: 2, desc: "Vaso grande" },
    { categoryIdx: 3, name: "Inca Kola 500ml", price: 600, prep: 1, desc: "" },
    { categoryIdx: 3, name: "Limonada Frozen", price: 1200, prep: 5, desc: "Con hierbabuena" },
    { categoryIdx: 3, name: "Pisco Sour", price: 2500, prep: 5, desc: "Clásico peruano" },
    // Postres
    { categoryIdx: 4, name: "Suspiro a la Limeña", price: 1500, prep: 5, desc: "Dulce tradición" },
    { categoryIdx: 4, name: "Picarones", price: 1800, prep: 10, desc: "Con miel de chancaca" },
    { categoryIdx: 4, name: "Tres Leches", price: 1600, prep: 5, desc: "Suave y esponjoso" },
  ];

  for (const item of menuItems) {
    await db.insert(schema.menuItems).values({
      category_id: createdCategories[item.categoryIdx].id,
      branch_id: branch.id,
      organization_id: org.id,
      name: item.name,
      description: item.desc || null,
      price: item.price,
      preparation_time_min: item.prep,
    });
  }

  console.log(`✅ ${menuItems.length} items de menú creados`);

  // 7. Create tables
  for (let i = 1; i <= 12; i++) {
    await db.insert(schema.tables).values({
      branch_id: branch.id,
      organization_id: org.id,
      number: i,
      capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
      qr_code: `demo-principal-T${i}-${Date.now().toString(36)}${i}`,
      status: "available",
    });
  }

  console.log("✅ 12 mesas creadas");

  // 8. Create loyalty program
  const [program] = await db
    .insert(schema.loyaltyPrograms)
    .values({
      organization_id: org.id,
      name: "Puntos RestAI",
      points_per_currency_unit: 1,
      currency_per_point: 100,
    })
    .returning();

  await db.insert(schema.loyaltyTiers).values([
    { program_id: program.id, name: "Bronce", min_points: 0, multiplier: 100, benefits: {} },
    { program_id: program.id, name: "Plata", min_points: 500, multiplier: 150, benefits: { freeDelivery: true } },
    { program_id: program.id, name: "Oro", min_points: 2000, multiplier: 200, benefits: { freeDelivery: true, prioritySeating: true } },
  ]);

  console.log("✅ Programa de fidelización creado con 3 tiers");

  // 9. Create some inventory categories and items
  const [invCat] = await db
    .insert(schema.inventoryCategories)
    .values({ branch_id: branch.id, organization_id: org.id, name: "Insumos Principales" })
    .returning();

  const inventoryItemsData = [
    { name: "Pescado fresco", unit: "kg", current_stock: "25.000", min_stock: "5.000", cost_per_unit: 3500 },
    { name: "Papas", unit: "kg", current_stock: "50.000", min_stock: "10.000", cost_per_unit: 300 },
    { name: "Arroz", unit: "kg", current_stock: "40.000", min_stock: "8.000", cost_per_unit: 400 },
    { name: "Limones", unit: "kg", current_stock: "15.000", min_stock: "3.000", cost_per_unit: 500 },
    { name: "Cebolla roja", unit: "kg", current_stock: "20.000", min_stock: "5.000", cost_per_unit: 250 },
    { name: "Ají amarillo", unit: "kg", current_stock: "8.000", min_stock: "2.000", cost_per_unit: 800 },
    { name: "Pisco", unit: "lt", current_stock: "12.000", min_stock: "3.000", cost_per_unit: 4500 },
  ];

  for (const item of inventoryItemsData) {
    await db.insert(schema.inventoryItems).values({
      branch_id: branch.id,
      organization_id: org.id,
      category_id: invCat.id,
      ...item,
    });
  }

  console.log(`✅ ${inventoryItemsData.length} items de inventario creados`);

  console.log("\n🎉 Seed completado!");
  console.log("\n📋 Credenciales de acceso:");
  console.log("   Admin:    admin@restai.pe / admin12345");
  console.log("   Manager:  manager@restai.pe / gerente123");
  console.log("   Cashier:   cashier@restai.pe / cajero1234");
  console.log("   Waiter:   mesero@restai.pe / mesero1234");
  console.log("   Kitchen:   kitchen@restai.pe / cocina1234");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
