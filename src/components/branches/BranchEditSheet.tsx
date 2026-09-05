"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { DangerButton } from "@/components/ui/DangerButton";
import { Dialog } from "@/components/ui/Dialog";
import { GhostButton } from "@/components/ui/GhostButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import {
  createBranchAction,
  deleteBranchAction,
  updateBranchAction,
} from "@/lib/branches/actions";
import { BRANCH_HAS_EMPLOYEES } from "@/lib/errors";
import type { Branch } from "@/lib/types";

export function BranchEditSheet({
  open,
  branch,
  onClose,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  branch: Branch | null;
  onClose: () => void;
  onSaved: (branch: Branch) => void;
  onDeleted?: (id: string) => void;
}) {
  const isEdit = Boolean(branch);
  const [name, setName] = useState(branch?.name ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  async function onSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("지점 이름을 입력하세요.");
      return;
    }
    setLoading(true);
    const result = branch
      ? await updateBranchAction(branch.id, trimmed)
      : await createBranchAction(trimmed);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved({
      ...result.data,
      activeEmployeeCount: branch?.activeEmployeeCount ?? 0,
    });
  }

  async function onDelete() {
    if (!branch) return;
    setLoading(true);
    const result = await deleteBranchAction(branch.id);
    setLoading(false);
    setConfirmDelete(false);
    if (!result.ok) {
      if (result.error === BRANCH_HAS_EMPLOYEES) {
        setAlertMessage(BRANCH_HAS_EMPLOYEES);
        return;
      }
      setError(result.error);
      return;
    }
    onDeleted?.(branch.id);
  }

  return (
    <>
      <Dialog
        open={open}
        title={isEdit ? "지점 수정" : "지점 추가"}
        onClose={onClose}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-2">
            <TextField
              className="min-w-0 flex-1"
              label="이름"
              value={name}
              onChange={(value) => {
                setName(value);
                setError("");
              }}
              error={error}
              disabled={loading}
            />
            {isEdit ? (
              <button
                type="button"
                aria-label="삭제"
                disabled={loading}
                onClick={() => setConfirmDelete(true)}
                className="mt-[22px] flex size-14 shrink-0 items-center justify-center rounded-16 text-danger disabled:opacity-60"
              >
                <Trash2 size={22} strokeWidth={2} />
              </button>
            ) : null}
          </div>
          <div className="flex gap-3">
            <GhostButton onClick={onClose} disabled={loading}>
              취소
            </GhostButton>
            <PrimaryButton onClick={() => void onSubmit()} loading={loading}>
              {isEdit ? "저장" : "추가"}
            </PrimaryButton>
          </div>
        </div>
      </Dialog>
      <Dialog
        open={confirmDelete}
        title="지점 삭제"
        onClose={() => setConfirmDelete(false)}
      >
        <p className="text-15 text-ink">이 지점을 삭제할까요?</p>
        <div className="mt-6 flex gap-3">
          <GhostButton onClick={() => setConfirmDelete(false)}>
            취소
          </GhostButton>
          <DangerButton loading={loading} onClick={() => void onDelete()}>
            삭제
          </DangerButton>
        </div>
      </Dialog>
      <Dialog
        open={Boolean(alertMessage)}
        title="지점 삭제"
        onClose={() => setAlertMessage("")}
      >
        <p className="text-15 text-ink">{alertMessage}</p>
        <div className="mt-6">
          <PrimaryButton onClick={() => setAlertMessage("")}>확인</PrimaryButton>
        </div>
      </Dialog>
    </>
  );
}
