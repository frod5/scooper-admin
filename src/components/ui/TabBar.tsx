"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type TabItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export function TabBar({
  items,
  pendingCount = 0,
  className,
}: {
  items: TabItem[];
  pendingCount?: number;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      className={cn("border-t border-line bg-surface", className)}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul
        className="grid"
        style={{
          height: "var(--tabbar-h)",
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const showAdminPending =
            item.href === "/admin/requests" && pendingCount > 0;
          const showRequestPending =
            item.href === "/app/requests" && pendingCount > 0;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "relative flex h-full flex-col items-center justify-center gap-0.5",
                  active ? "text-accent" : "text-muted",
                )}
              >
                <span className="relative">
                  <Icon size={24} strokeWidth={active ? 2.4 : 1.8} />
                  {showAdminPending ? (
                    <span className="absolute -right-2.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-surface">
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                  ) : null}
                  {showRequestPending ? (
                    <span className="absolute -right-1 -top-0.5 size-2 rounded-full bg-danger" />
                  ) : null}
                </span>
                <span className="text-[11px] font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
