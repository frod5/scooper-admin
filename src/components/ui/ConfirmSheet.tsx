"use client";

import type { ReactNode } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { DangerButton } from "@/components/ui/DangerButton";
import { GhostButton } from "@/components/ui/GhostButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export function ConfirmSheet({
  open,
  title,
  body,
  confirmLabel = "확인",
  cancelLabel = "취소",
  danger = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet open={open} title={title} onClose={onClose}>
      <p className="text-15 text-ink">{body}</p>
      <div className="mt-6 flex gap-3">
        <GhostButton onClick={onClose}>{cancelLabel}</GhostButton>
        {danger ? (
          <DangerButton onClick={onConfirm}>{confirmLabel}</DangerButton>
        ) : (
          <PrimaryButton onClick={onConfirm}>{confirmLabel}</PrimaryButton>
        )}
      </div>
    </BottomSheet>
  );
}
