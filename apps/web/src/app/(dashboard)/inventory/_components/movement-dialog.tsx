"use client";

import { useState } from "react";
import { Input } from "@restai/ui/components/input";
import { Label } from "@restai/ui/components/label";
import { Button } from "@restai/ui/components/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@restai/ui/components/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@restai/ui/components/dialog";
import { useCreateMovement } from "@/hooks/use-inventory";
import { toast } from "sonner";

export function CreateMovementDialog({
  open,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: any[];
}) {
  const createMovement = useCreateMovement();
  const [form, setForm] = useState({
    itemId: "none",
    type: "purchase",
    quantity: "",
    reference: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.itemId || form.itemId === "none" || !form.quantity) return;
    try {
      await createMovement.mutateAsync({
        itemId: form.itemId,
        type: form.type,
        quantity: parseFloat(form.quantity),
        reference: form.reference || undefined,
        notes: form.notes || undefined,
      });
      setForm({
        itemId: "none",
        type: "purchase",
        quantity: "",
        reference: "",
        notes: "",
      });
      onOpenChange(false);
      toast.success("Movement registered successfully");
    } catch (err) {
      toast.error(`Error: ${(err as Error).message}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Movement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="movItem">Item *</Label>
            <Select
              value={form.itemId}
              onValueChange={(v) => setForm({ ...form, itemId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select item..." />
              </SelectTrigger>
              <SelectContent>
                {items.map((item: any) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} ({item.unit}) - Stock:{" "}
                    {parseFloat(item.current_stock).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="movType">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="consumption">Consumption</SelectItem>
                  <SelectItem value="waste">Waste</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="movQty">Quantity *</Label>
              <Input
                id="movQty"
                type="number"
                step="0.001"
                placeholder="0"
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="movRef">Reference</Label>
            <Input
              id="movRef"
              placeholder="Invoice no., supplier, etc."
              value={form.reference}
              onChange={(e) =>
                setForm({ ...form, reference: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="movNotes">Notes</Label>
            <Input
              id="movNotes"
              placeholder="Observations..."
              value={form.notes}
              onChange={(e) =>
                setForm({ ...form, notes: e.target.value })
              }
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createMovement.isPending || !form.itemId || form.itemId === "none" || !form.quantity
              }
            >
              {createMovement.isPending
                ? "Registering..."
                : "Register Movement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
