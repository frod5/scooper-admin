import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/Spinner";

type DangerButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export function DangerButton({
  loading,
  className,
  disabled,
  children,
  type = "button",
  ...props
}: DangerButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex h-12 w-full items-center justify-center rounded-pill bg-danger-soft px-4 text-17 text-danger",
        "active:opacity-90 disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {loading ? <Spinner className="text-danger" /> : children}
    </button>
  );
}
