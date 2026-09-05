"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { GhostButton } from "@/components/ui/GhostButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { createOwnerRequestAction } from "@/lib/owner-requests/actions";

export function OwnerRequestSheet({
  open,
  onClose,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  onSent: (message: string) => void;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const text = body.trim();
    if (!text) {
      setError("요청 내용을 입력하세요.");
      return;
    }
    setLoading(true);
    const result = await createOwnerRequestAction({ body: text });
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
        : "사장님에게 요청을 보냈습니다.",
    );
  }

  return (
    <Dialog open={open} title="사장님에게 요청하기" onClose={onClose}>
      {error ? (
        <div className="mb-3">
          <ErrorBanner message={error} />
        </div>
      ) : null}
      <TextField
        label="요청 내용"
        value={body}
        onChange={(value) => {
          setBody(value);
          setError("");
        }}
        disabled={loading}
        placeholder="필요한 내용을 입력하세요."
      />
      <div className="mt-5 flex gap-3">
        <GhostButton onClick={onClose} disabled={loading}>
          취소
        </GhostButton>
        <PrimaryButton loading={loading} onClick={() => void send()}>
          보내기
        </PrimaryButton>
      </div>
    </Dialog>
  );
}
