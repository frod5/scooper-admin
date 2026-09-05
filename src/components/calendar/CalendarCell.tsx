"use client";

import { EventChip } from "@/components/calendar/EventChip";
import { useShiftDnd } from "@/components/calendar/ShiftDnd";
import { cn } from "@/lib/cn";
import type { WorkAssignment } from "@/lib/types";

export type CalendarCellPerson = {
  userId: string;
  name: string;
  isMine?: boolean;
  assignmentId?: string;
};

export function CalendarCell({
  date,
  day,
  weekday,
  isToday,
  selected,
  names,
  pending,
  assignmentsById,
  draggableIds,
  onSelect,
}: {
  date: string;
  day: number;
  weekday: number;
  isToday: boolean;
  selected?: boolean;
  names: CalendarCellPerson[];
  pending?: boolean;
  assignmentsById?: Map<string, WorkAssignment>;
  draggableIds?: Set<string>;
  onSelect: () => void;
}) {
  const { bindDrag, overDate, draggingId } = useShiftDnd();
  const visible = names.slice(0, 3);
  const extra = names.length - visible.length;
  const dropActive = overDate === date;

  return (
    <div
      data-drop-date={date}
      className={cn(
        "relative flex min-h-16 w-full flex-col rounded-8 px-0.5 pb-1 pt-1",
        dropActive && "bg-accent-soft ring-2 ring-accent",
        selected && !dropActive && "bg-accent-soft/70",
      )}
    >
      {pending ? (
        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-warn" />
      ) : null}
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center justify-center"
      >
        <span
          className={cn(
            "flex size-5 items-center justify-center text-[12px] font-semibold",
            isToday && "rounded-full bg-accent text-[11px] font-bold text-surface",
            !isToday && selected && "text-accent",
            !isToday && !selected && weekday === 0 && "text-sunday",
            !isToday && !selected && weekday === 6 && "text-saturday",
            !isToday && !selected && weekday !== 0 && weekday !== 6 && "text-ink",
          )}
        >
          {day}
        </span>
      </button>
      <div className="mt-0.5 flex min-h-0 flex-1 flex-col gap-px overflow-hidden">
        {visible.map((person) => {
          const assignment =
            person.assignmentId && assignmentsById
              ? assignmentsById.get(person.assignmentId)
              : undefined;
          const canDrag =
            Boolean(assignment && draggableIds?.has(assignment.id)) &&
            draggingId !== assignment?.id;
          return (
            <div
              key={person.userId}
              className={canDrag ? "touch-none" : undefined}
              {...(canDrag && assignment ? bindDrag(assignment) : {})}
            >
              <EventChip
                name={person.name}
                userId={person.userId}
                mine={person.isMine}
              />
            </div>
          );
        })}
        {extra > 0 ? (
          <span className="text-11 text-muted">+{extra}</span>
        ) : null}
      </div>
    </div>
  );
}
