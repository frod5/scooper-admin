import { cn } from "@/lib/cn";
import { chipTint } from "@/lib/schedules/view";

const TINTS = [
  "bg-chip-0-bg text-chip-0-fg",
  "bg-chip-1-bg text-chip-1-fg",
  "bg-chip-2-bg text-chip-2-fg",
  "bg-chip-3-bg text-chip-3-fg",
  "bg-chip-4-bg text-chip-4-fg",
  "bg-chip-5-bg text-chip-5-fg",
] as const;

const DOTS = [
  "bg-chip-0-fg",
  "bg-chip-1-fg",
  "bg-chip-2-fg",
  "bg-chip-3-fg",
  "bg-chip-4-fg",
  "bg-chip-5-fg",
] as const;

export function EventChip({
  name,
  userId,
  mine,
}: {
  name: string;
  userId: string;
  mine?: boolean;
}) {
  return (
    <span
      title={name}
      className={cn(
        "flex h-4 max-w-full items-center truncate rounded px-1 text-11 font-semibold",
        mine
          ? "border-l-2 border-accent bg-accent-soft text-accent"
          : TINTS[chipTint(userId)],
      )}
    >
      {name}
    </span>
  );
}

export function tintDotClass(userId: string, mine?: boolean) {
  if (mine) return "bg-accent";
  return DOTS[chipTint(userId)];
}
