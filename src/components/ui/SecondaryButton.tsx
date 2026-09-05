import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/Spinner";

type SecondaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export function SecondaryButton({
  loading,
  className,
  disabled,
  children,
  type = "button",
  ...props
}: SecondaryButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex h-14 w-full items-center justify-center rounded-16 bg-accent-soft px-4 text-17 font-semibold text-accent",
        "active:bg-accent-soft disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}
