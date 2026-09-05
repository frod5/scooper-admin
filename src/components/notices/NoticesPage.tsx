"use client";

import { useState } from "react";
import { NoticeDetailSheet } from "@/components/notices/NoticeDetailSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ListRow } from "@/components/ui/ListRow";
import { formatNoticeStamp } from "@/lib/datetime";
import { listNoticesAction } from "@/lib/notices/actions";
import type { Notice } from "@/lib/types";

export function NoticesPage({
  initialNotices,
  loadError,
  emptyMessage = "보낸 공지가 없습니다.",
}: {
  initialNotices: Notice[];
  loadError?: string;
  emptyMessage?: string;
}) {
  const [notices, setNotices] = useState(initialNotices);
  const [banner, setBanner] = useState(loadError ?? "");
  const [detail, setDetail] = useState<Notice | null>(null);

  async function retry() {
    const result = await listNoticesAction();
    if (!result.ok) {
      setBanner(result.error);
      return;
    }
    setBanner("");
    setNotices(result.data);
  }

  return (
    <div>
      {banner ? (
        <div className="mb-4">
          <ErrorBanner message={banner} onRetry={() => void retry()} />
        </div>
      ) : null}

      {!banner && notices.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="flex flex-col gap-3">
          {notices.map((notice) => (
            <ListRow
              key={notice.id}
              title={notice.title}
              subtitle={`${formatNoticeStamp(notice.created_at)} · ${
                notice.branch_id ? (notice.branch_name ?? "지점") : "전체"
              }`}
              onClick={() => setDetail(notice)}
            />
          ))}
        </div>
      )}

      {detail ? (
        <NoticeDetailSheet
          open
          notice={detail}
          onClose={() => setDetail(null)}
        />
      ) : null}
    </div>
  );
}
