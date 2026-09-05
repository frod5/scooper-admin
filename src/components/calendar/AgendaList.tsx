"use client";

import { AgendaHeader } from "@/components/calendar/AgendaHeader";
import { AgendaRow } from "@/components/calendar/AgendaRow";
import { sortMineFirst } from "@/lib/schedules/view";
import type { WorkAssignment } from "@/lib/types";

export function AgendaList({
  date,
  assignments,
  myUserId,
  showBranch,
  hint,
  draggableIds,
  onEdit,
  onDelete,
  onRequestMine,
}: {
  date: string;
  assignments: WorkAssignment[];
  myUserId?: string;
  showBranch?: boolean;
  hint?: string | null;
  draggableIds?: Set<string>;
  onEdit?: (assignment: WorkAssignment) => void;
  onDelete?: (assignment: WorkAssignment) => void;
  onRequestMine?: (assignment: WorkAssignment) => void;
}) {
  const sorted = sortMineFirst(assignments, myUserId);
  const count = sorted.filter((item) => item.status === "active").length;

  return (
    <section>
      <AgendaHeader date={date} count={count} hint={hint} />
      {sorted.length === 0 ? null : (
        <div className="mt-3 flex flex-col gap-3">
          {sorted.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-16 bg-surface shadow-card"
            >
              <AgendaRow
                assignment={item}
                myUserId={myUserId}
                showBranch={showBranch}
                canDrag={draggableIds?.has(item.id)}
                onEdit={onEdit ? () => onEdit(item) : undefined}
                onDelete={onDelete ? () => onDelete(item) : undefined}
                onRequest={
                  onRequestMine && myUserId && item.user_id === myUserId
                    ? () => onRequestMine(item)
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
