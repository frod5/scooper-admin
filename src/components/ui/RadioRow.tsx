"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function RadioRow({
  name,
  value,
  checked,
  label,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  label: string;
  onChange: (value: string) => void;
  children?: ReactNode;
}) {
  return (
    <div>
      <label className="flex min-h-14 cursor-pointer items-center gap-3 py-3">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          className="size-5 accent-accent"
        />
        <span className={cn("text-15", checked ? "text-ink" : "text-ink")}>
          {label}
        </span>
      </label>
      {checked && children ? <div className="pb-3 pl-8">{children}</div> : null}
    </div>
  );
}
