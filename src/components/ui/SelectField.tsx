"use client";

import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export type SelectOption = {
  value: string;
  label: string;
};

export function SelectField({
  label,
  value,
  onChange,
  options,
  error,
  disabled,
  placeholder = "선택",
  name,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  name?: string;
}) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-13 text-muted">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-12 w-full appearance-none rounded-12 bg-surface-2 px-3 pr-10 text-15 text-ink outline-none",
            "focus:ring-2 focus:ring-accent",
            error && "ring-2 ring-danger",
            disabled && "opacity-60",
            !value && "text-muted",
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={24}
          strokeWidth={2}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>
      {error ? <p className="mt-1 text-13 text-danger">{error}</p> : null}
    </div>
  );
}
