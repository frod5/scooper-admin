"use client";

import {
  CalendarCell,
  type CalendarCellPerson,
} from "@/components/calendar/CalendarCell";
import { cn } from "@/lib/cn";
import { WEEKDAY_LABELS, buildMonthGrid, todayISO } from "@/lib/datetime";
import type { WorkAssignment } from "@/lib/types";

export type CalendarDayContent = {
  names: CalendarCellPerson[];
  pendingCount: number;
  minePending?: boolean;
};

export function CalendarMonth({
  year,
  month,
  selectedDate,
  days,
  memoDates,
  assignmentsById,
  draggableIds,
  onSelect,
}: {
  year: number;
  month: number;
  selectedDate?: string | null;
  days: Record<string, CalendarDayContent>;
  memoDates?: Set<string>;
  assignmentsById?: Map<string, WorkAssignment>;
  draggableIds?: Set<string>;
  onSelect: (date: string) => void;
}) {
  const today = todayISO();
  const cells = buildMonthGrid(year, month);

  return (
    <div className="overflow-hidden rounded-16 bg-surface shadow-card">
      <div className="grid grid-cols-7">
        {WEEKDAY_LABELS.map((label, index) => (
          <div
            key={label}
            className={cn(
              "pb-1 pt-1 text-center text-11 font-semibold",
              index === 0
                ? "text-sunday"
                : index === 6
                  ? "text-saturday"
                  : "text-muted",
            )}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, index) => {
          if (!cell.date || cell.day === null) {
            return <div key={`empty-${index}`} className="min-h-16" />;
          }
          const content = days[cell.date] ?? {
            names: [],
            pendingCount: 0,
          };
          return (
            <div
              key={cell.date}
              className="border-hairline border-b border-r"
            >
              <CalendarCell
                date={cell.date}
                day={cell.day}
                weekday={cell.weekday}
                isToday={cell.date === today}
                selected={selectedDate === cell.date}
                names={content.names}
                pending={
                  Boolean(content.minePending) || content.pendingCount > 0
                }
                hasMemo={Boolean(memoDates?.has(cell.date))}
                assignmentsById={assignmentsById}
                draggableIds={draggableIds}
                onSelect={() => onSelect(cell.date!)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 overflow-hidden rounded-16 bg-surface shadow-card">
      {Array.from({ length: 35 }).map((_, index) => (
        <div
          key={index}
          className="min-h-16 border-hairline border-b border-r bg-surface-2/60"
        />
      ))}
    </div>
  );
}
