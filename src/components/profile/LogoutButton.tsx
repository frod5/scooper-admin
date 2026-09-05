"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { GhostButton } from "@/components/ui/GhostButton";
import { logoutAction } from "@/lib/auth/actions";

export function LogoutButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <GhostButton className="text-danger" onClick={() => setOpen(true)}>
        로그아웃
      </GhostButton>
      <ConfirmDialog
        open={open}
        title="로그아웃"
        body="로그아웃할까요?"
        confirmLabel="확인"
        onClose={() => setOpen(false)}
        onConfirm={() => {
          void logoutAction();
        }}
      />
    </>
  );
}
