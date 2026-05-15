"use client";

import { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { Input } from "@restai/ui/components/input";
import { Label } from "@restai/ui/components/label";
import { Button } from "@restai/ui/components/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@restai/ui/components/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@restai/ui/components/dialog";
import { useCreatePayment, useUnpaidOrders } from "@/hooks/use-payments";
import { formatCurrency } from "@/lib/utils";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedOrderId?: string;
}

export function PaymentDialog({
  open,
  onOpenChange,
  preselectedOrderId,
}: PaymentDialogProps) {
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [method, setMethod] = useState("cash");
  const [amount, setAmount] = useState("");
  const [tip, setTip] = useState("");
  const [reference, setReference] = useState("");
  const [result, setResult] = useState<any>(null);

  const { data: unpaidOrders } = useUnpaidOrders();
  const createPayment = useCreatePayment();

  const orders: any[] = unpaidOrders ?? [];
  const selectedOrder = orders.find((o: any) => o.id === selectedOrderId);

  // Auto-select preselected order
  useEffect(() => {
    if (open && preselectedOrderId) {
      setSelectedOrderId(preselectedOrderId);
    }
  }, [open, preselectedOrderId]);

  // Pre-fill amount when order is selected
  useEffect(() => {
    if (selectedOrder) {
      setAmount((selectedOrder.remaining / 100).toFixed(2));
    }
  }, [selectedOrder]);

  const resetState = () => {
    setSelectedOrderId("");
    setMethod("cash");
    setAmount("");
    setTip("");
    setReference("");
    setResult(null);
  };

  const handleClose = (value: boolean) => {
    if (!value) resetState();
    onOpenChange(value);
  };

  const handleCreate = async () => {
    if (!selectedOrderId || !amount) return;
    try {
      const res = await createPayment.mutateAsync({
        orderId: selectedOrderId,
        method,
        amount: Math.round(parseFloat(amount) * 100),
        reference: reference || undefined,
        tip: tip ? Math.round(parseFloat(tip) * 100) : 0,
      });
      setResult(res);
    } catch {}
  };

  const amountCents = Math.round((parseFloat(amount) || 0) * 100);
  const showChange =
    method === "cash" && selectedOrder && amountCents > selectedOrder.remaining;
  const changeAmount = showChange
    ? amountCents - selectedOrder.remaining
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register Payment</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h3 className="text-lg font-semibold">Payment registered</h3>
            <p className="text-sm text-muted-foreground text-center">
              {result.fully_paid
                ? `Order #${result.order_number} fully paid`
                : `Partial payment. Remaining ${formatCurrency(result.remaining)}`}
            </p>
            <Button onClick={() => handleClose(false)}>Close</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {/* Order selector */}
              <div className="space-y-2">
                <Label>Order</Label>
                {preselectedOrderId ? (
                  <div className="flex items-center h-9 rounded-md border border-input bg-muted/50 px-3 text-sm">
                    {selectedOrder
                      ? `#${selectedOrder.order_number} — Table ${selectedOrder.table_number ?? "—"} — ${formatCurrency(selectedOrder.remaining)}`
                      : `Order ${preselectedOrderId.slice(0, 8)}...`}
                  </div>
                ) : (
                  <Select
                    value={selectedOrderId || undefined}
                    onValueChange={setSelectedOrderId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select order" />
                    </SelectTrigger>
                    <SelectContent>
                      {orders.map((order: any) => (
                        <SelectItem key={order.id} value={order.id}>
                          #{order.order_number} — Table{" "}
                          {order.table_number ?? "—"} —{" "}
                          {formatCurrency(order.remaining)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Order info panel */}
              {selectedOrder && (
                <div className="rounded-lg border bg-muted/50 p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order:</span>
                    <span>#{selectedOrder.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer:</span>
                    <span>{selectedOrder.customer_name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                  {selectedOrder.total_paid > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid:</span>
                      <span>{formatCurrency(selectedOrder.total_paid)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold">
                    <span>Pending:</span>
                    <span>{formatCurrency(selectedOrder.remaining)}</span>
                  </div>
                </div>
              )}

              {/* Payment method */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="yape">Yape</SelectItem>
                    <SelectItem value="plin">Plin</SelectItem>
                    <SelectItem value="transfer">Bank Transfer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount and tip */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pay-amount">Amount (S/)</Label>
                  <Input
                    id="pay-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay-tip">Tip (S/)</Label>
                  <Input
                    id="pay-tip"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={tip}
                    onChange={(e) => setTip(e.target.value)}
                  />
                </div>
              </div>

              {/* Cash change calculator */}
              {showChange && (
                <p className="text-sm font-medium text-green-600">
                  Change: S/ {(changeAmount / 100).toFixed(2)}
                </p>
              )}

              {/* Reference */}
              <div className="space-y-2">
                <Label htmlFor="pay-reference">Reference</Label>
                <Input
                  id="pay-reference"
                  placeholder="Transaction number, etc."
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  createPayment.isPending || !selectedOrderId || !amount
                }
              >
                {createPayment.isPending ? "Registering..." : "Register Payment"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
