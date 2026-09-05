import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type GhostButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function GhostButton({
  className,
  type = "button",
  children,
  ...props
}: GhostButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center rounded-pill bg-transparent px-4 text-17 text-ink",
        "active:bg-surface-2 disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
