import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";

export function FAB({
  onClick,
  className,
  label = "근무 추가",
}: {
  onClick: () => void;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex size-[var(--fab-size)] items-center justify-center rounded-full bg-accent text-surface",
        "active:bg-accent-press",
        className,
      )}
    >
      <Plus size={24} strokeWidth={2} />
    </button>
  );
}
