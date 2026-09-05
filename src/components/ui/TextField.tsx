"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  trailing?: ReactNode;
};

export function TextField({
  label,
  value,
  onChange,
  error,
  trailing,
  className,
  id,
  disabled,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1 block text-13 text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-14 w-full rounded-16 bg-surface px-4 text-17 text-ink outline-none",
            "placeholder:text-muted",
            "focus:ring-2 focus:ring-accent",
            error && "ring-2 ring-danger",
            trailing ? "pr-14" : undefined,
            disabled && "opacity-60",
          )}
          {...props}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {trailing}
          </div>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-13 text-danger">{error}</p> : null}
    </div>
  );
}
