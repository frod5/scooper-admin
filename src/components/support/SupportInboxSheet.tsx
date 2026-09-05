"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { formatNoticeStamp } from "@/lib/datetime";
import { roleLabel } from "@/lib/roles";
import { listSupportTicketsAction } from "@/lib/support/actions";
import type { SupportTicket } from "@/lib/types";

export function SupportInboxSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    void listSupportTicketsAction().then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError("");
      setTickets(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Dialog open={open} title="고객센터 요청" onClose={onClose}>
      {error ? (
        <div className="mb-3">
          <ErrorBanner message={error} />
        </div>
      ) : null}
      {loading ? <LoadingBlock /> : null}
      {!loading && tickets.length === 0 && !error ? (
        <EmptyState message="받은 요청이 없습니다." />
      ) : null}
      {!loading ? (
        <div className="flex flex-col gap-3">
          {tickets.map((ticket) => (
            <article
              key={ticket.id}
              className="rounded-16 bg-surface-2 px-4 py-3"
            >
              <p className="text-13 text-muted">
                {formatNoticeStamp(ticket.created_at)} · {ticket.name} ·{" "}
                {roleLabel(ticket.role)}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-15 text-ink">
                {ticket.body}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </Dialog>
  );
}
