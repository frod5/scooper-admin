"use client";

import { Dialog } from "@/components/ui/Dialog";
import { GhostButton } from "@/components/ui/GhostButton";
import { formatNoticeStamp } from "@/lib/datetime";
import type { Notice } from "@/lib/types";

export function NoticeDetailSheet({
  open,
  notice,
  onClose,
}: {
  open: boolean;
  notice: Notice;
  onClose: () => void;
}) {
  const target = notice.branch_id ? (notice.branch_name ?? "") : "전체";
  return (
    <Dialog open={open} title={notice.title} onClose={onClose}>
      <p className="text-13 text-muted">
        {formatNoticeStamp(notice.created_at)} · {target}
      </p>
      <p className="mt-4 whitespace-pre-wrap text-15 text-ink">{notice.body}</p>
      <GhostButton className="mt-6" onClick={onClose}>
        닫기
      </GhostButton>
    </Dialog>
  );
}
