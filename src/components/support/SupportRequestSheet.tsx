"use client";

import { useId, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { GhostButton } from "@/components/ui/GhostButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { createSupportTicketAction } from "@/lib/support/actions";

export function SupportRequestSheet({
  open,
  onClose,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  onSent: (message: string) => void;
}) {
  const bodyId = useId();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const nextError = body.trim() ? "" : "요청사항을 입력하세요.";
    setError(nextError);
    if (nextError) return;
    setLoading(true);
    const result = await createSupportTicketAction({ body });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBody("");
    onClose();
    onSent(
      result.pushFailed
        ? "요청은 저장됐지만 알림에 실패했습니다."
        : "요청을 보냈습니다.",
    );
  }

  return (
    <Dialog open={open} title="고객센터" onClose={onClose}>
      {error ? (
        <div className="mb-3">
          <ErrorBanner message={error} />
        </div>
      ) : null}
      <label htmlFor={bodyId} className="mb-1 block text-13 text-muted">
        요청사항
      </label>
      <textarea
        id={bodyId}
        rows={6}
        value={body}
        disabled={loading}
        placeholder="필요한 내용을 적어 주세요."
        onChange={(event) => {
          setBody(event.target.value);
          setError("");
        }}
        className="w-full rounded-12 bg-surface-2 px-3 py-2 text-15 text-ink outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
      />
      <div className="mt-5 flex gap-3">
        <GhostButton onClick={onClose} disabled={loading}>
          취소
        </GhostButton>
        <PrimaryButton onClick={() => void send()} loading={loading}>
          보내기
        </PrimaryButton>
      </div>
    </Dialog>
  );
}
