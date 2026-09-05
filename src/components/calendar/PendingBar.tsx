"use client";

export function PendingBar({
  count,
  onOpen,
}: {
  count: number;
  onOpen: () => void;
}) {
  if (count <= 0) return null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-between rounded-16 bg-warn-soft px-4 py-3 text-left shadow-card"
    >
      <span className="text-13 font-semibold text-warn">대기 {count}건</span>
      <span className="text-13 font-semibold text-accent">처리 →</span>
    </button>
  );
}
