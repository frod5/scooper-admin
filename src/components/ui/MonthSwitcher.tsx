"use client";

import { monthLabel, shiftMonth } from "@/lib/datetime";

export function MonthSwitcher({
  year,
  month,
  onChange,
}: {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}) {
  return (
    <div className="flex w-full items-center gap-1">
      <p className="min-w-0 flex-1 truncate text-left text-22 font-bold text-ink">
        {monthLabel(year, month)}
      </p>
      <button
        type="button"
        aria-label="이전 달"
        className="flex size-8 items-center justify-center rounded-full bg-bg text-17 text-ink"
        onClick={() => {
          const next = shiftMonth(year, month, -1);
          onChange(next.year, next.month);
        }}
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="다음 달"
        className="flex size-8 items-center justify-center rounded-full bg-bg text-17 text-ink"
        onClick={() => {
          const next = shiftMonth(year, month, 1);
          onChange(next.year, next.month);
        }}
      >
        ›
      </button>
    </div>
  );
}
