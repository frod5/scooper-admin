"use client";

import { useId, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { GhostButton } from "@/components/ui/GhostButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { createInventoryMemoAction } from "@/lib/inventory/actions";
import { todayISO } from "@/lib/datetime";
import type { InventoryMemo } from "@/lib/types";

export function InventoryMemoSheet({
  open,
  branchName,
  onClose,
  onCreated,
}: {
  open: boolean;
  branchName: string | null;
  onClose: () => void;
  onCreated: (memo: InventoryMemo) => void;
}) {
  const bodyId = useId();
  const [memoDate, setMemoDate] = useState(todayISO());
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    const text = body.trim();
    if (!text) {
      setError("재고 메모를 입력하세요.");
      return;
    }
    setLoading(true);
    const result = await createInventoryMemoAction({
      memoDate,
      body: text,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onCreated(result.data);
    onClose();
  }

  return (
    <Dialog open={open} title="재고 메모" onClose={onClose}>
      {error ? (
        <div className="mb-3">
          <ErrorBanner message={error} />
        </div>
      ) : null}
      <div className="flex flex-col gap-4">
        <TextField
          label="재고 입력 날짜"
          type="date"
          value={memoDate}
          onChange={(value) => {
            setMemoDate(value);
            setError("");
          }}
          disabled={loading}
        />
        <div>
          <p className="mb-1 text-13 text-muted">지점</p>
          <p className="flex h-14 items-center rounded-16 bg-surface-2 px-4 text-17 text-ink">
            {branchName || "소속 지점 없음"}
          </p>
        </div>
        <div>
          <label htmlFor={bodyId} className="mb-1 block text-13 text-muted">
            내용
          </label>
          <textarea
            id={bodyId}
            rows={6}
            value={body}
            disabled={loading}
            placeholder="재고 내용을 입력하세요."
            onChange={(event) => {
              setBody(event.target.value);
              setError("");
            }}
            className="w-full rounded-12 bg-surface-2 px-3 py-2 text-15 text-ink outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
          />
        </div>
        <div className="flex gap-3">
          <GhostButton onClick={onClose} disabled={loading}>
            취소
          </GhostButton>
          <PrimaryButton loading={loading} onClick={() => void submit()}>
            등록
          </PrimaryButton>
        </div>
      </div>
    </Dialog>
  );
}
