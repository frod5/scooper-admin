"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export function ListRow({
  title,
  subtitle,
  titleMuted,
  right,
  showChevron,
  onClick,
}: {
  title: string;
  subtitle?: string;
  titleMuted?: boolean;
  right?: ReactNode;
  showChevron?: boolean;
  onClick?: () => void;
}) {
  const chevron = showChevron ?? Boolean(onClick);
  const className = cn(
    "flex min-h-16 w-full items-center gap-3 rounded-[20px] bg-surface px-5 py-3 text-left",
  );

  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-17", titleMuted ? "text-muted" : "text-ink")}>
          {title}
        </p>
        {subtitle ? (
          <p className="truncate text-13 text-muted">{subtitle}</p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
      {chevron ? (
        <ChevronRight
          size={24}
          strokeWidth={2}
          className="shrink-0 text-muted"
        />
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}
