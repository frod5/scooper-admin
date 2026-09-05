export function TodayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-8 rounded-pill bg-accent px-3 text-13 font-bold uppercase tracking-wide text-surface"
    >
      오늘
    </button>
  );
}
