"use client";

import { cn } from "@/lib/cn";

export type FilterChip = {
  value: string;
  label: string;
};

export function FilterChips({
  options,
  value,
  onChange,
}: {
  options: FilterChip[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "h-8 shrink-0 rounded-pill px-3 text-13",
              selected
                ? "bg-accent-soft font-semibold text-accent"
                : "bg-surface text-muted",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
