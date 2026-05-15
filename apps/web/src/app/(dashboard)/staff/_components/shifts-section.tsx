"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@restai/ui/components/card";
import { Button } from "@restai/ui/components/button";
import { Clock, LogOut } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ShiftsSectionProps {
  shifts: any[];
  isLoading: boolean;
  currentUserId: string | undefined;
  onEndShift: (shiftId: string) => void;
  endShiftPending: boolean;
}

export function ShiftsSection({
  shifts,
  isLoading,
  currentUserId,
  onEndShift,
  endShiftPending,
}: ShiftsSectionProps) {
  const activeShifts = shifts.filter((s: any) => !s.end_time);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Active Shifts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : activeShifts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No active shifts
          </p>
        ) : (
          <div className="space-y-3">
            {activeShifts.map((shift: any) => (
              <div
                key={shift.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <p className="font-medium text-sm">{shift.user_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Start: {formatDate(shift.start_time)}
                  </p>
                </div>
                {shift.user_id === currentUserId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEndShift(shift.id)}
                    disabled={endShiftPending}
                  >
                    <LogOut className="h-3 w-3 mr-1" />
                    End Shift
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
