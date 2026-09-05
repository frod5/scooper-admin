"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

export function SearchField({
  value,
  onChange,
  placeholder = "이름 또는 전화번호",
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <Search
        size={24}
        strokeWidth={2}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-10 w-full rounded-pill bg-surface-2 py-0 pl-12 pr-3 text-15 text-ink outline-none",
          "placeholder:text-muted",
          "focus:ring-2 focus:ring-accent",
          disabled && "opacity-60",
        )}
      />
    </div>
  );
}
