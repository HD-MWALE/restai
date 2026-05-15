"use client";

import { useState } from "react";
import { Button } from "@restai/ui/components/button";
import { Card, CardContent } from "@restai/ui/components/card";
import { Badge } from "@restai/ui/components/badge";
import { Label } from "@restai/ui/components/label";
import { DatePicker } from "@restai/ui/components/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@restai/ui/components/dialog";
import { Clock, DollarSign, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTableHistory } from "@/hooks/use-tables";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-muted rounded", className)} />;
}

interface HistoryDialogProps {
  table: any | null;
  onClose: () => void;
}

export function HistoryDialog({ table, onClose }: HistoryDialogProps) {
  const [historyFrom, setHistoryFrom] = useState<string | undefined>();
  const [historyTo, setHistoryTo] = useState<string | undefined>();
  const { data: historyData, isLoading: historyLoading } = useTableHistory(table?.id, historyFrom, historyTo);

  return (
    <Dialog open={!!table} onOpenChange={(open) => { if (!open) { setHistoryFrom(undefined); setHistoryTo(undefined); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            History - Table {table?.number}
          </DialogTitle>
          <DialogDescription>
            Past sessions, orders, and revenue
          </DialogDescription>
        </DialogHeader>
        {table && (
          <div className="space-y-4">
            {/* Date range filter */}
            <div className="flex gap-3 items-end">
              <div className="space-y-1 flex-1">
                <Label className="text-xs">From</Label>
                <DatePicker
                  value={historyFrom}
                  onChange={setHistoryFrom}
                  placeholder="Start date"
                />
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-xs">To</Label>
                <DatePicker
                  value={historyTo}
                  onChange={setHistoryTo}
                  placeholder="End date"
                />
              </div>
              {(historyFrom || historyTo) && (
                <Button variant="ghost" size="sm" onClick={() => { setHistoryFrom(undefined); setHistoryTo(undefined); }}>
                  Clear
                </Button>
              )}
            </div>

            {/* Summary */}
            {historyData && (
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-3 text-center">
                    <DollarSign className="h-4 w-4 mx-auto mb-1 text-green-600" />
                    <p className="text-lg font-bold">S/ {(historyData.summary.total_revenue / 100).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Total revenue</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <ShoppingCart className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                    <p className="text-lg font-bold">{historyData.summary.total_orders}</p>
                    <p className="text-xs text-muted-foreground">Orders</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <Clock className="h-4 w-4 mx-auto mb-1 text-orange-600" />
                    <p className="text-lg font-bold">{historyData.summary.avg_duration_minutes} min</p>
                    <p className="text-xs text-muted-foreground">Average duration</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Sessions list */}
            {historyLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : historyData?.sessions.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No sessions recorded for this table
              </p>
            ) : (
              <div className="space-y-2">
                {historyData?.sessions.map((session: any) => (
                  <Card key={session.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{session.customer_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {session.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(session.started_at).toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {session.duration_minutes !== null && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {session.duration_minutes} min
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3" />
                          {session.order_count} orders
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          S/ {(session.total_revenue / 100).toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
