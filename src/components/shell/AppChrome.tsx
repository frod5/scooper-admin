"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronLeft, Megaphone } from "lucide-react";
import { NoticeComposeSheet } from "@/components/notices/NoticeComposeSheet";
import { InstallHomeButton } from "@/components/pwa/InstallHomeButton";
import { PushPrompt } from "@/components/pwa/PushPrompt";
import { NoticeToast } from "@/components/ui/NoticeToast";
import { PageShell } from "@/components/ui/PageShell";
import type { TabItem } from "@/components/ui/TabBar";
import type { Branch, UserRole } from "@/lib/types";

export function AppChrome({
  title,
  role,
  userName,
  branches = [],
  extraRight,
  tabs,
  pendingCount = 0,
  unreadCount = 0,
  children,
}: {
  title: string;
  role: UserRole;
  userName: string;
  branches?: Branch[];
  extraRight?: ReactNode;
  tabs: TabItem[];
  pendingCount?: number;
  unreadCount?: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [toast, setToast] = useState("");
  const notificationsHref =
    role === "employee" ? "/app/notifications" : "/admin/notifications";
  const settingsBackHref = pathname.startsWith("/app/settings/")
    ? "/app/settings"
    : pathname.startsWith("/admin/settings/")
      ? "/admin/settings"
      : pathname.startsWith("/admin/notifications")
        ? "/admin"
        : pathname.startsWith("/app/notifications")
          ? "/app"
          : null;

  return (
    <PageShell
      title={title}
      headerLeft={
        settingsBackHref ? (
          <button
            type="button"
            aria-label="뒤로"
            className="flex size-8 items-center justify-center text-ink"
            onClick={() => router.push(settingsBackHref)}
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
        ) : undefined
      }
      headerRight={
        <div className="flex items-center gap-2">
          {role === "owner" || role === "system_admin" ? (
            <HeaderIcon label="공지" onClick={() => setNoticeOpen(true)}>
              <Megaphone size={22} strokeWidth={2} />
            </HeaderIcon>
          ) : null}
          <InstallHomeButton />
          {extraRight}
          <Link
            href={notificationsHref}
            aria-label={
              unreadCount > 0 ? `알림 ${unreadCount}건` : "알림"
            }
            className="relative flex size-8 items-center justify-center text-ink"
          >
            <Bell size={22} strokeWidth={2} />
            {unreadCount > 0 ? (
              <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-surface">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Link>
          {userName ? (
            <span className="max-w-[28vw] truncate text-13 font-semibold text-ink">
              {userName}님
            </span>
          ) : null}
        </div>
      }
      tabs={tabs}
      pendingCount={pendingCount}
    >
      <PushPrompt />
      {children}
      {noticeOpen ? (
        <NoticeComposeSheet
          open
          branches={branches}
          onClose={() => setNoticeOpen(false)}
          onSent={(message) => setToast(message)}
        />
      ) : null}
      {toast ? (
        <NoticeToast message={toast} variant="ok" onDone={() => setToast("")} />
      ) : null}
    </PageShell>
  );
}

function HeaderIcon({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-8 items-center justify-center text-ink"
    >
      {children}
    </button>
  );
}
