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
import { useCreateInventoryItem } from "@/hooks/use-inventory";
import { toast } from "sonner";

export function CreateItemDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createItem = useCreateInventoryItem();
  const [form, setForm] = useState({
    name: "",
    unit: "kg",
    currentStock: "",
    minStock: "",
    costPerUnit: "",
    category: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    try {
      await createItem.mutateAsync({
        name: form.name,
        unit: form.unit,
        currentStock: parseFloat(form.currentStock) || 0,
        minStock: parseFloat(form.minStock) || 0,
        costPerUnit: Math.round(parseFloat(form.costPerUnit || "0") * 100),
        category: form.category || undefined,
      });
      setForm({
        name: "",
        unit: "kg",
        currentStock: "",
        minStock: "",
        costPerUnit: "",
        category: "",
      });
      onOpenChange(false);
      toast.success("Item created successfully");
    } catch (err) {
      toast.error(`Error: ${(err as Error).message}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Inventory Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="itemName">Name *</Label>
            <Input
              id="itemName"
              placeholder="Ex: Rice, Chicken, Oil..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="itemCategory">Category</Label>
            <Input
              id="itemCategory"
              placeholder="Ex: Meat, Vegetables, Dairy..."
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="itemUnit">Unit</Label>
              <Select
                value={form.unit}
                onValueChange={(v) => setForm({ ...form, unit: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  <SelectItem value="g">Grams (g)</SelectItem>
                  <SelectItem value="lt">Liters (lt)</SelectItem>
                  <SelectItem value="ml">Mililiters (ml)</SelectItem>
                  <SelectItem value="und">Units (pcs)</SelectItem>
                  <SelectItem value="paq">Packages (pkg)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemCost">Cost per unit (S/)</Label>
              <Input
                id="itemCost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.costPerUnit}
                onChange={(e) =>
                  setForm({ ...form, costPerUnit: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="itemStock">Initial Stock</Label>
              <Input
                id="itemStock"
                type="number"
                step="0.001"
                min="0"
                placeholder="0"
                value={form.currentStock}
                onChange={(e) =>
                  setForm({ ...form, currentStock: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemMinStock">Minimum Stock</Label>
              <Input
                id="itemMinStock"
                type="number"
                step="0.001"
                min="0"
                placeholder="0"
                value={form.minStock}
                onChange={(e) =>
                  setForm({ ...form, minStock: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createItem.isPending || !form.name}>
              {createItem.isPending ? "Creating..." : "Create Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
