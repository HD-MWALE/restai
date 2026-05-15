"use client";

import { useState } from "react";
import { Card, CardContent } from "@restai/ui/components/card";
import { Input } from "@restai/ui/components/input";
import { Label } from "@restai/ui/components/label";
import { Button } from "@restai/ui/components/button";
import { Plus } from "lucide-react";
import { useRecipe } from "@/hooks/use-inventory";

export function RecipesTab({
  items,
  onNewRecipe,
}: {
  items: any[];
  onNewRecipe: () => void;
}) {
  const [recipeMenuItemId, setRecipeMenuItemId] = useState("");
  const { data: recipeData } = useRecipe(recipeMenuItemId);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Configure recipes to automatically deduct inventory when an order is completed.
        </p>
        <Button onClick={onNewRecipe}>
          <Plus className="h-4 w-4 mr-2" />
          New Recipe
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>View recipe for a menu item</Label>
            <Input
              placeholder="Menu item ID (UUID)"
              value={recipeMenuItemId}
              onChange={(e) => setRecipeMenuItemId(e.target.value)}
            />
          </div>
          {recipeMenuItemId && recipeData && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Ingredients:
              </p>
              {(recipeData as any[]).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recipe configured
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-2 text-sm font-medium text-muted-foreground">
                          Ingredient
                        </th>
                        <th className="text-right p-2 text-sm font-medium text-muted-foreground">
                          Quantity
                        </th>
                        <th className="text-center p-2 text-sm font-medium text-muted-foreground">
                          Unit
                        </th>
                        <th className="text-right p-2 text-sm font-medium text-muted-foreground">
                          Stock
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(recipeData as any[]).map(
                        (ing: any, i: number) => (
                          <tr
                            key={i}
                            className="border-b border-border last:border-0"
                          >
                            <td className="p-2 text-sm text-foreground">
                              {ing.item_name}
                            </td>
                            <td className="p-2 text-sm text-right text-foreground">
                              {parseFloat(ing.quantity_used).toFixed(3)}
                            </td>
                            <td className="p-2 text-sm text-center text-muted-foreground">
                              {ing.item_unit}
                            </td>
                            <td className="p-2 text-sm text-right text-muted-foreground">
                              {parseFloat(ing.current_stock).toFixed(2)}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
