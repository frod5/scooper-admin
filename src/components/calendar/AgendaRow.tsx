"use client";

import { Pencil, Trash2 } from "lucide-react";
import {
  tintDotClass,
  useChipTintIndex,
} from "@/components/calendar/EventChip";
import { useShiftDnd } from "@/components/calendar/ShiftDnd";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import { formatTimeRange, hoursLabel } from "@/lib/datetime";
import { displayName } from "@/lib/schedules/view";
import type { WorkAssignment } from "@/lib/types";

export function AgendaRow({
  assignment,
  myUserId,
  showBranch,
  canDrag,
  onEdit,
  onDelete,
  onRequest,
}: {
  assignment: WorkAssignment;
  myUserId?: string;
  showBranch?: boolean;
  canDrag?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onRequest?: () => void;
}) {
  const mine = Boolean(myUserId && assignment.user_id === myUserId);
  const tint = useChipTintIndex(assignment.user_id);
  const resigned = assignment.status === "resigned";
  const { bindDrag, draggingId } = useShiftDnd();
  const dragging = draggingId === assignment.id;
  const dragBind = canDrag ? bindDrag(assignment) : {};

  return (
    <div
      className={cn(
        "flex min-h-16 w-full items-center gap-3 bg-surface px-4 py-3 text-left",
        dragging && "opacity-40",
      )}
      {...dragBind}
    >
      <span
        className={cn(
          "h-10 w-1 shrink-0 rounded-pill",
          tintDotClass(assignment.user_id, mine, tint),
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-15 font-semibold tabular-nums text-muted">
          {formatTimeRange(assignment.start_time, assignment.end_time)}
          {" · "}
          {hoursLabel(assignment.start_time, assignment.end_time)}
        </p>
        <p
          className={cn(
            "mt-0.5 truncate text-15 font-semibold",
            resigned ? "text-muted" : "text-ink",
          )}
        >
          {displayName(assignment, myUserId)}
          {showBranch && assignment.branch_name
            ? ` · ${assignment.branch_name}`
            : ""}
        </p>
      </div>
      {mine ? <StatusBadge variant="mine" /> : null}
      {resigned ? <StatusBadge variant="resigned" /> : null}
      {onRequest ? (
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onRequest}
          className="h-9 shrink-0 rounded-pill bg-accent px-3 text-13 font-semibold text-surface active:bg-accent-press"
        >
          변경 요청
        </button>
      ) : null}
      {onEdit ? (
        <button
          type="button"
          aria-label="근무 수정"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onEdit}
          className="flex size-9 shrink-0 items-center justify-center text-ink"
        >
          <Pencil size={20} strokeWidth={2} />
        </button>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          aria-label="근무 삭제"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onDelete}
          className="flex size-9 shrink-0 items-center justify-center text-danger"
        >
          <Trash2 size={20} strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}
