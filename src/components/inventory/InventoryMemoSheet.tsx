"use client";

import { useId, useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { GhostButton } from "@/components/ui/GhostButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import {
  createInventoryMemoAction,
  updateInventoryMemoAction,
} from "@/lib/inventory/actions";
import { todayISO } from "@/lib/datetime";
import type { InventoryItem, InventoryMemo } from "@/lib/types";

const fieldClass =
  "h-12 w-full rounded-12 bg-surface-2 px-3 text-15 text-ink outline-none placeholder:text-muted focus:ring-2 focus:ring-accent disabled:opacity-60";

export function InventoryMemoSheet({
  open,
  branchName,
  memo,
  onClose,
  onSaved,
}: {
  open: boolean;
  branchName: string | null;
  memo?: InventoryMemo | null;
  onClose: () => void;
  onSaved: (memo: InventoryMemo) => void;
}) {
  const labelId = useId();
  const dateId = useId();
  const editing = Boolean(memo);
  const [memoDate, setMemoDate] = useState(memo?.memo_date ?? todayISO());
  const [labelInput, setLabelInput] = useState("");
  const [items, setItems] = useState<InventoryItem[]>(memo?.items ?? []);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function addLabel() {
    const label = labelInput.trim();
    if (!label) {
      setError("항목 이름을 입력하세요.");
      return;
    }
    if (items.some((item) => item.label === label)) {
      setError("이미 추가한 항목입니다.");
      return;
    }
    setItems((current) => [...current, { label, qty: Number.NaN }]);
    setLabelInput("");
    setError("");
  }

  function setQty(index: number, value: string) {
    const qty = value === "" ? Number.NaN : Number(value);
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, qty } : item,
      ),
    );
    setError("");
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function submit() {
    if (items.length === 0) {
      setError("항목을 추가하세요.");
      return;
    }
    if (items.some((item) => !Number.isFinite(item.qty) || item.qty < 0)) {
      setError("수량을 입력하세요.");
      return;
    }
    setLoading(true);
    const result =
      editing && memo
        ? await updateInventoryMemoAction({
            id: memo.id,
            memoDate,
            items,
          })
        : await createInventoryMemoAction({
            memoDate,
            items,
          });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved({
      ...result.data,
      author_name: result.data.author_name || memo?.author_name || "",
      branch_name: result.data.branch_name || memo?.branch_name || branchName,
    });
    onClose();
  }

  return (
    <Dialog
      open={open}
      title={editing ? "재고 메모 수정" : "재고 메모"}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={dateId} className="mb-1 block text-13 text-muted">
              날짜
            </label>
            <input
              id={dateId}
              type="date"
              value={memoDate}
              disabled={loading}
              onChange={(event) => {
                setMemoDate(event.target.value);
                setError("");
              }}
              className={fieldClass}
            />
          </div>
          <div>
            <p className="mb-1 text-13 text-muted">지점</p>
            <p className="flex h-12 items-center text-15 font-semibold text-ink">
              {branchName || "소속 지점 없음"}
            </p>
          </div>
        </div>

        <div>
          <label htmlFor={labelId} className="mb-1 block text-13 text-muted">
            항목
          </label>
          <div className="flex gap-2">
            <input
              id={labelId}
              value={labelInput}
              disabled={loading}
              placeholder="레몬"
              onChange={(event) => {
                setLabelInput(event.target.value);
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addLabel();
                }
              }}
              className={fieldClass}
            />
            <button
              type="button"
              disabled={loading}
              onClick={addLabel}
              className="h-12 shrink-0 rounded-12 px-4 text-15 font-semibold text-accent disabled:opacity-60"
            >
              추가
            </button>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="overflow-hidden rounded-16 bg-surface-2">
            {items.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="flex items-center gap-2 px-3 py-2"
              >
                <p className="min-w-0 flex-1 truncate text-15 font-semibold text-ink">
                  {item.label}
                </p>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={Number.isFinite(item.qty) ? item.qty : ""}
                  disabled={loading}
                  aria-label={`${item.label} 수량`}
                  onChange={(event) => setQty(index, event.target.value)}
                  className="h-10 w-16 rounded-12 bg-surface px-2 text-center text-15 tabular-nums text-ink outline-none [appearance:textfield] focus:ring-2 focus:ring-accent disabled:opacity-60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="w-4 text-13 text-muted">개</span>
                <button
                  type="button"
                  aria-label={`${item.label} 삭제`}
                  disabled={loading}
                  onClick={() => removeItem(index)}
                  className="flex size-10 shrink-0 items-center justify-center text-muted disabled:opacity-60"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-13 text-muted">
            항목을 추가한 뒤 수량만 입력하세요.
          </p>
        )}

        {error ? <p className="text-13 text-danger">{error}</p> : null}

        <div className="flex gap-3">
          <GhostButton onClick={onClose} disabled={loading}>
            취소
          </GhostButton>
          <PrimaryButton loading={loading} onClick={() => void submit()}>
            {editing ? "저장" : "등록"}
          </PrimaryButton>
        </div>
      </div>
    </Dialog>
  );
}
