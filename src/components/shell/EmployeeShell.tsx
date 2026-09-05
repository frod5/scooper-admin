"use client";

import { Clock, Home, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppChrome } from "@/components/shell/AppChrome";
import type { TabItem } from "@/components/ui/TabBar";

const TABS: TabItem[] = [
  { href: "/app", label: "홈", icon: Home, exact: true },
  { href: "/app/requests", label: "변경요청", icon: Clock },
  { href: "/app/settings", label: "설정", icon: Settings },
];

function titleFor(pathname: string) {
  if (pathname.startsWith("/app/settings/profile")) return "회원정보관리";
  if (pathname.startsWith("/app/settings/notices")) return "공지사항 내역";
  if (pathname.startsWith("/app/settings")) return "설정";
  if (pathname.startsWith("/app/requests")) return "변경요청";
  if (pathname.startsWith("/app/notifications")) return "알림";
  return "SCOOPER";
}

export function EmployeeShell({
  children,
  userName,
  pendingCount = 0,
  unreadCount = 0,
}: {
  children: ReactNode;
  userName: string;
  branchName: string | null;
  pendingCount?: number;
  unreadCount?: number;
}) {
  const pathname = usePathname();

  return (
    <AppChrome
      title={titleFor(pathname)}
      role="employee"
      userName={userName}
      tabs={TABS}
      pendingCount={pendingCount}
      unreadCount={unreadCount}
    >
      {children}
    </AppChrome>
  );
}
