"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { TextField } from "@/components/ui/TextField";

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  name?: string;
  autoComplete?: string;
  placeholder?: string;
};

export function PasswordField({
  label,
  value,
  onChange,
  error,
  disabled,
  name,
  autoComplete = "current-password",
  placeholder,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      label={label}
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled}
      name={name}
      autoComplete={autoComplete}
      placeholder={placeholder}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
          onClick={() => setVisible((current) => !current)}
          className="flex size-8 items-center justify-center text-muted"
          tabIndex={-1}
        >
          {visible ? (
            <EyeOff size={20} strokeWidth={2} />
          ) : (
            <Eye size={20} strokeWidth={2} />
          )}
        </button>
      }
    />
  );
}
