"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function BottomSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
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
      <div className="relative mx-auto h-full w-full max-w-[520px]">
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
            "absolute inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto rounded-t-16 bg-surface px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-2 shadow-sheet",
          )}
        >
          <div className="mx-auto mb-3 h-1 w-9 rounded-pill bg-handle" />
          {title ? <h2 className="mb-3 text-22 text-ink">{title}</h2> : null}
          {children}
        </div>
      </div>
    </div>
  );
}

export function ResponsiveSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <BottomSheet open={open} title={title} onClose={onClose}>
      {children}
    </BottomSheet>
  );
}
