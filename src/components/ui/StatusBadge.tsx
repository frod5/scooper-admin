import { cn } from "@/lib/cn";

const VARIANTS = {
  active: { className: "bg-ok-soft text-ok", label: "근무중" },
  resigned: { className: "bg-off-soft text-off", label: "퇴사" },
  pending: { className: "bg-warn-soft text-warn", label: "대기" },
  approved: { className: "bg-ok-soft text-ok", label: "승인" },
  rejected: { className: "bg-danger-soft text-danger", label: "거절" },
  count: { className: "bg-accent-soft text-accent", label: null },
  mine: { className: "bg-accent-soft text-accent", label: "나" },
} as const;

type StatusBadgeProps = {
  variant: keyof typeof VARIANTS;
  children?: string;
};

export function StatusBadge({ variant, children }: StatusBadgeProps) {
  const spec = VARIANTS[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-8 px-2 py-0.5 text-11 font-semibold",
        spec.className,
      )}
    >
      {children ?? spec.label}
    </span>
  );
}
