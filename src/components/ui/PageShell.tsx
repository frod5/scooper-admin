import type { ReactNode } from "react";
import { AppHeader } from "@/components/ui/AppHeader";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { TabBar, type TabItem } from "@/components/ui/TabBar";

export function PageShell({
  title,
  headerLeft,
  headerRight,
  hideHeader,
  children,
  tabs,
  pendingCount = 0,
  fab,
}: {
  title?: string;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  hideHeader?: boolean;
  children: ReactNode;
  tabs: TabItem[];
  pendingCount?: number;
  fab?: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-bg">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[520px] flex-col bg-bg">
        {hideHeader ? null : (
          <div className="sticky top-0 z-20">
            <AppHeader
              title={title}
              left={headerLeft}
              right={headerRight}
            />
          </div>
        )}
        <main
          className="flex-1 px-4 pt-3"
          style={{
            paddingBottom:
              "calc(var(--tabbar-h) + env(safe-area-inset-bottom) + 16px)",
          }}
        >
          <PullToRefresh>{children}</PullToRefresh>
        </main>
        {fab ? (
          <div
            className="pointer-events-none absolute right-4 z-30"
            style={{
              bottom:
                "calc(var(--tabbar-h) + env(safe-area-inset-bottom) + 16px)",
            }}
          >
            <div className="pointer-events-auto">{fab}</div>
          </div>
        ) : null}
        <div className="sticky bottom-0 z-20 mt-auto">
          <TabBar items={tabs} pendingCount={pendingCount} />
        </div>
      </div>
    </div>
  );
}
