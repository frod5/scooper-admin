"use client";

import { GhostButton } from "@/components/ui/GhostButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  DEFAULT_END,
  DEFAULT_START,
  formatTimeRange,
  shortDayLabel,
} from "@/lib/datetime";
import type { ChangeRequest } from "@/lib/types";

export function ChangeRequestCard({
  request,
  admin,
  onApprove,
  onReject,
  onCancel,
}: {
  request: ChangeRequest;
  admin?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
}) {
  return (
    <div className="rounded-16 bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-15 font-semibold text-ink">
            {request.name}
          </p>
          {admin && request.branch_name ? (
            <p className="truncate text-13 text-muted">{request.branch_name}</p>
          ) : null}
        </div>
        <StatusBadge variant="pending" />
      </div>
      <p className="mt-1 text-13 text-ink">
        {request.requested_date !== request.work_date
          ? `${shortDayLabel(request.work_date)} ${formatTimeRange(
              request.current_start ?? DEFAULT_START,
              request.current_end ?? DEFAULT_END,
            )} → ${shortDayLabel(request.requested_date)} ${formatTimeRange(
              request.requested_start,
              request.requested_end,
            )}`
          : `${formatTimeRange(
              request.current_start ?? DEFAULT_START,
              request.current_end ?? DEFAULT_END,
            )} → ${formatTimeRange(request.requested_start, request.requested_end)}`}
      </p>
      {request.reason ? (
        <p className="mt-1 text-13 text-muted">{request.reason}</p>
      ) : null}
      {admin && onApprove && onReject ? (
        <div className="mt-3 flex gap-2">
          <GhostButton
            className="h-9 text-15"
            onClick={() => onReject(request.id)}
          >
            거절
          </GhostButton>
          <PrimaryButton
            className="h-9 text-15"
            onClick={() => onApprove(request.id)}
          >
            승인
          </PrimaryButton>
        </div>
      ) : null}
      {!admin && onCancel ? (
        <div className="mt-3 flex justify-end">
          <GhostButton
            className="h-9 text-15"
            onClick={() => onCancel(request.id)}
          >
            요청 취소
          </GhostButton>
        </div>
      ) : null}
    </div>
  );
}
