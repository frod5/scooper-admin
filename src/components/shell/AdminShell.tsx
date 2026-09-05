"use client";

import { Clock, Home, Settings, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AppChrome } from "@/components/shell/AppChrome";
import { GhostButton } from "@/components/ui/GhostButton";
import type { TabItem } from "@/components/ui/TabBar";
import type { Branch, UserRole } from "@/lib/types";

type HeaderAction = { label: string; onClick: () => void };

const AdminPageContext = createContext<{
  role: UserRole;
  userName: string;
  userRoleLabel: string;
  setHeaderAction: (action: HeaderAction | null) => void;
} | null>(null);

export function useAdminRole() {
  const ctx = useContext(AdminPageContext);
  if (!ctx) throw new Error("useAdminRole must be used within AdminShell");
  return ctx.role;
}

export function useAdminSession() {
  const ctx = useContext(AdminPageContext);
  if (!ctx) throw new Error("useAdminSession must be used within AdminShell");
  return { name: ctx.userName, roleLabel: ctx.userRoleLabel, role: ctx.role };
}

export function useAdminHeaderAction(action: HeaderAction | null) {
  const ctx = useContext(AdminPageContext);
  const setHeaderAction = ctx?.setHeaderAction;
  const label = action?.label;
  const onClick = action?.onClick;

  useEffect(() => {
    if (!setHeaderAction) return;
    if (label && onClick) setHeaderAction({ label, onClick });
    else setHeaderAction(null);
    return () => setHeaderAction(null);
  }, [setHeaderAction, label, onClick]);
}

const TABS: TabItem[] = [
  { href: "/admin", label: "홈", icon: Home, exact: true },
  { href: "/admin/employees", label: "직원관리", icon: Users },
  { href: "/admin/requests", label: "근무변경요청", icon: Clock },
  { href: "/admin/settings", label: "설정", icon: Settings },
];

function titleFor(pathname: string) {
  if (pathname.startsWith("/admin/employees")) return "직원관리";
  if (pathname.startsWith("/admin/requests")) return "근무변경요청";
  if (pathname.startsWith("/admin/settings/profile")) return "회원정보관리";
  if (pathname.startsWith("/admin/settings/branches")) return "지점관리";
  if (pathname.startsWith("/admin/settings/notices")) return "공지 알림 내역";
  if (pathname.startsWith("/admin/settings")) return "설정";
  return "SCOOPER";
}

export function AdminShell({
  children,
  userName,
  userRole,
  userRoleLabel,
  pendingCount = 0,
  branches = [],
}: {
  children: ReactNode;
  userName: string;
  userRole: UserRole;
  userRoleLabel: string;
  pendingCount?: number;
  branches?: Branch[];
}) {
  const pathname = usePathname();
  const [headerAction, setHeaderAction] = useState<HeaderAction | null>(null);
  const persistHeaderAction = useCallback((action: HeaderAction | null) => {
    setHeaderAction(action);
  }, []);

  return (
    <AdminPageContext.Provider
      value={{
        role: userRole,
        userName,
        userRoleLabel,
        setHeaderAction: persistHeaderAction,
      }}
    >
      <AppChrome
        title={titleFor(pathname)}
        role={userRole}
        userName={userName}
        branches={branches}
        extraRight={
          headerAction ? (
            <GhostButton
              onClick={headerAction.onClick}
              className="h-auto w-auto px-0 text-15 font-semibold text-accent"
            >
              {headerAction.label}
            </GhostButton>
          ) : null
        }
        tabs={TABS}
        pendingCount={pendingCount}
      >
        {children}
      </AppChrome>
    </AdminPageContext.Provider>
  );
}
