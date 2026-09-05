import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

function ScooperLogo() {
  return (
    <img
      src="/scooper-logo.png"
      alt="SCOOPER"
      width={32}
      height={32}
      className="size-8 rounded-[8px]"
    />
  );
}

export function AppHeader({
  title,
  left,
  right,
  className,
}: {
  title?: string;
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn("bg-bg px-4 text-ink", className)}
      style={{
        minHeight: "calc(var(--header-h) + env(safe-area-inset-top))",
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <div className="grid h-[var(--header-h)] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="justify-self-start">{left ?? <ScooperLogo />}</div>
        {title ? (
          <h1 className="max-w-[46vw] truncate text-center text-22 font-bold text-ink">
            {title}
          </h1>
        ) : (
          <span />
        )}
        <div className="justify-self-end">{right}</div>
      </div>
    </header>
  );
}
