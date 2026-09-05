"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CircleHelp } from "lucide-react";

export function HintTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex shrink-0">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        className="flex size-8 items-center justify-center rounded-full text-muted"
        onClick={() => setOpen((current) => !current)}
      >
        <CircleHelp size={18} strokeWidth={2} />
      </button>
      {open ? (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1 whitespace-nowrap rounded-12 bg-ink px-3 py-2 text-13 text-surface shadow-sheet"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
