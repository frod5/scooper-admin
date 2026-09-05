"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { GhostButton } from "@/components/ui/GhostButton";

export function MoreSheet({
  open,
  name,
  roleLabel,
  onClose,
  onLogout,
}: {
  open: boolean;
  name: string;
  roleLabel: string;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <BottomSheet open={open} title="계정" onClose={onClose}>
      <p className="text-17 text-ink">{name}</p>
      <p className="mt-1 text-13 text-muted">{roleLabel}</p>
      <GhostButton
        className="mt-6 text-danger"
        onClick={onLogout}
      >
        로그아웃
      </GhostButton>
    </BottomSheet>
  );
}
