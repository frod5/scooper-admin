"use client";

import { useState } from "react";
import { LogoutButton } from "@/components/profile/LogoutButton";
import { SettingsMenu } from "@/components/profile/SettingsMenu";
import { SupportRequestSheet } from "@/components/support/SupportRequestSheet";
import { NoticeToast } from "@/components/ui/NoticeToast";

export function EmployeeSettingsScreen() {
  const [supportOpen, setSupportOpen] = useState(false);
  const [toast, setToast] = useState("");

  return (
    <div className="flex flex-col gap-8 pb-8">
      <SettingsMenu
        profileHref="/app/settings/profile"
        noticesHref="/app/settings/notices"
        noticesLabel="공지사항 내역"
        supportLabel="고객센터 요청"
        onSupport={() => setSupportOpen(true)}
      />
      <LogoutButton />
      {supportOpen ? (
        <SupportRequestSheet
          open
          onClose={() => setSupportOpen(false)}
          onSent={(message) => setToast(message)}
        />
      ) : null}
      {toast ? (
        <NoticeToast message={toast} variant="ok" onDone={() => setToast("")} />
      ) : null}
    </div>
  );
}
