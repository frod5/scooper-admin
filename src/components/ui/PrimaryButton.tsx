import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/Spinner";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export function PrimaryButton({
  loading,
  className,
  disabled,
  children,
  type = "button",
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex h-14 w-full items-center justify-center rounded-16 bg-accent px-4 text-17 font-semibold text-surface",
        "active:bg-accent-press disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {loading ? <Spinner className="text-surface" /> : children}
    </button>
  );
}
