import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { buildChipTintMap, chipTint } from "@/lib/schedules/view";

const TINTS = [
  "border-chip-0-fg bg-chip-0-bg text-chip-0-fg",
  "border-chip-1-fg bg-chip-1-bg text-chip-1-fg",
  "border-chip-2-fg bg-chip-2-bg text-chip-2-fg",
  "border-chip-3-fg bg-chip-3-bg text-chip-3-fg",
  "border-chip-4-fg bg-chip-4-bg text-chip-4-fg",
  "border-chip-5-fg bg-chip-5-bg text-chip-5-fg",
  "border-chip-6-fg bg-chip-6-bg text-chip-6-fg",
  "border-chip-7-fg bg-chip-7-bg text-chip-7-fg",
  "border-chip-8-fg bg-chip-8-bg text-chip-8-fg",
  "border-chip-9-fg bg-chip-9-bg text-chip-9-fg",
  "border-chip-10-fg bg-chip-10-bg text-chip-10-fg",
  "border-chip-11-fg bg-chip-11-bg text-chip-11-fg",
] as const;

const DOTS = [
  "bg-chip-0-fg",
  "bg-chip-1-fg",
  "bg-chip-2-fg",
  "bg-chip-3-fg",
  "bg-chip-4-fg",
  "bg-chip-5-fg",
  "bg-chip-6-fg",
  "bg-chip-7-fg",
  "bg-chip-8-fg",
  "bg-chip-9-fg",
  "bg-chip-10-fg",
  "bg-chip-11-fg",
] as const;

const ChipTintContext = createContext<Map<string, number> | null>(null);

export function ChipTintProvider({
  userIds,
  myUserId,
  children,
}: {
  userIds: readonly string[];
  myUserId?: string;
  children: ReactNode;
}) {
  const map = useMemo(
    () => buildChipTintMap(userIds, myUserId),
    [userIds, myUserId],
  );
  return (
    <ChipTintContext.Provider value={map}>{children}</ChipTintContext.Provider>
  );
}

export function useChipTintIndex(userId: string) {
  const map = useContext(ChipTintContext);
  return map?.get(userId) ?? chipTint(userId);
}

export function EventChip({
  name,
  userId,
  mine,
}: {
  name: string;
  userId: string;
  mine?: boolean;
}) {
  const tint = useChipTintIndex(userId);
  return (
    <span
      title={name}
      className={cn(
        "flex h-4 max-w-full items-center truncate rounded px-1 text-11 font-semibold border-l-2",
        mine
          ? "border-accent bg-accent-soft text-accent"
          : (TINTS[tint] ?? TINTS[0]),
      )}
    >
      {name}
    </span>
  );
}

export function tintDotClass(userId: string, mine?: boolean, tint?: number) {
  if (mine) return "bg-accent";
  return DOTS[tint ?? chipTint(userId)] ?? DOTS[0];
}
