"use client";

import { Card, CardContent } from "@restai/ui/components/card";
import { Badge } from "@restai/ui/components/badge";
import { Button } from "@restai/ui/components/button";
import { ArrowUpDown } from "lucide-react";
import { formatDate } from "@/lib/utils";

const movementTypeLabels: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  purchase: { label: "Purchase", variant: "default" },
  consumption: { label: "Consumption", variant: "secondary" },
  waste: { label: "Waste", variant: "destructive" },
  adjustment: { label: "Adjustment", variant: "outline" },
};

export function MovementsTab({
  movements,
  onNewMovement,
}: {
  movements: any[];
  onNewMovement: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onNewMovement}>
          <ArrowUpDown className="h-4 w-4 mr-2" />
          New Movement
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                    Item
                  </th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                    Quantity
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">
                    Reference
                  </th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-sm text-muted-foreground"
                    >
                      No movements registered
                    </td>
                  </tr>
                ) : (
                  movements.map((mov: any) => {
                    const typeConfig =
                      movementTypeLabels[mov.type] ||
                      movementTypeLabels.adjustment;
                    return (
                      <tr
                        key={mov.id}
                        className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-3">
                          <Badge variant={typeConfig.variant}>
                            {typeConfig.label}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm font-medium text-foreground">
                          {mov.item_name || "-"}
                        </td>
                        <td className="p-3 text-sm text-right font-medium text-foreground">
                          {parseFloat(mov.quantity).toFixed(3)}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">
                          {mov.reference || "-"}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground text-right hidden md:table-cell">
                          {mov.created_at
                            ? formatDate(mov.created_at)
                            : "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
