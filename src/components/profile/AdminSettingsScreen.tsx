"use client";

import { useState } from "react";
import { LogoutButton } from "@/components/profile/LogoutButton";
import { SettingsMenu } from "@/components/profile/SettingsMenu";
import { SupportInboxSheet } from "@/components/support/SupportInboxSheet";
import { SupportRequestSheet } from "@/components/support/SupportRequestSheet";
import { NoticeToast } from "@/components/ui/NoticeToast";
import type { UserRole } from "@/lib/types";

export function AdminSettingsScreen({ role }: { role: UserRole }) {
  const [supportOpen, setSupportOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [toast, setToast] = useState("");
  const isAdmin = role === "system_admin";

  return (
    <div className="flex flex-col gap-8 pb-8">
      <SettingsMenu
        profileHref="/admin/settings/profile"
        branchesHref="/admin/settings/branches"
        noticesHref="/admin/settings/notices"
        supportLabel={isAdmin ? "고객센터 요청" : "고객센터"}
        onSupport={() => {
          if (isAdmin) setInboxOpen(true);
          else setSupportOpen(true);
        }}
      />
      <LogoutButton />
      {supportOpen ? (
        <SupportRequestSheet
          open
          onClose={() => setSupportOpen(false)}
          onSent={(message) => setToast(message)}
        />
      ) : null}
      {inboxOpen ? (
        <SupportInboxSheet open onClose={() => setInboxOpen(false)} />
      ) : null}
      {toast ? (
        <NoticeToast message={toast} variant="ok" onDone={() => setToast("")} />
      ) : null}
    </div>
  );
}
