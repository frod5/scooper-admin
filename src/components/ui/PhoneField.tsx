"use client";

import { formatPhone, normalizePhone } from "@/lib/phone";
import { TextField } from "@/components/ui/TextField";

type PhoneFieldProps = {
  label: string;
  value: string;
  onChange: (digits: string) => void;
  error?: string;
  disabled?: boolean;
  name?: string;
  autoComplete?: string;
  placeholder?: string;
};

export function PhoneField({
  label,
  value,
  onChange,
  error,
  disabled,
  name,
  autoComplete = "tel",
  placeholder = "010-1234-5678",
}: PhoneFieldProps) {
  return (
    <TextField
      label={label}
      value={formatPhone(value)}
      onChange={(next) => onChange(normalizePhone(next))}
      error={error}
      disabled={disabled}
      name={name}
      autoComplete={autoComplete}
      type="tel"
      inputMode="numeric"
      placeholder={placeholder}
    />
  );
}
