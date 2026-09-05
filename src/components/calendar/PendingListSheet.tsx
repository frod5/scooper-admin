"use client";

import { ChangeRequestCard } from "@/components/calendar/ChangeRequestCard";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { ChangeRequest } from "@/lib/types";

export function PendingListSheet({
  open,
  requests,
  onClose,
  onApprove,
  onReject,
}: {
  open: boolean;
  requests: ChangeRequest[];
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <BottomSheet open={open} title="변경 요청" onClose={onClose}>
      <div className="flex flex-col gap-3">
        {requests.map((request) => (
          <ChangeRequestCard
            key={request.id}
            request={request}
            admin
            onApprove={onApprove}
            onReject={onReject}
          />
        ))}
      </div>
    </BottomSheet>
  );
}
