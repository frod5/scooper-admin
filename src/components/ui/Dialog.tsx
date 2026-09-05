"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Dialog({
  open,
  title,
  onClose,
  children,
  className,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="relative mx-auto flex h-full w-full max-w-[520px] items-center justify-center p-4">
        <button
          type="button"
          aria-label="닫기"
          className="absolute inset-0 bg-overlay"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={cn(
            "relative z-10 w-full max-h-[85dvh] overflow-y-auto rounded-16 bg-surface p-5 shadow-sheet",
            className,
          )}
        >
          {title ? <h2 className="mb-3 text-22 text-ink">{title}</h2> : null}
          {children}
        </div>
      </div>
    </div>
  );
}
