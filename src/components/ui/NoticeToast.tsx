"use client";

import { useEffect } from "react";
import { cn } from "@/lib/cn";

export function NoticeToast({
  message,
  onDone,
}: {
  message: string;
  variant?: "ok" | "danger";
  onDone?: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDone?.(), 3000);
    return () => window.clearTimeout(timer);
  }, [message, onDone]);

  return (
    <div
      role="status"
      className={cn(
        "fixed left-1/2 z-50 w-[min(calc(100%-32px),520px)] -translate-x-1/2 rounded-pill px-4 py-3 text-15 text-surface",
        "bg-ink/90",
        "bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+8px)]",
      )}
    >
      {message}
    </div>
  );
}
