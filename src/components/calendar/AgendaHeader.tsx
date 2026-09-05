import { dayTitle } from "@/lib/datetime";

export function AgendaHeader({
  date,
  count,
  hint,
}: {
  date: string;
  count: number;
  hint?: string | null;
}) {
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-17 font-bold text-ink">{dayTitle(date)}</h2>
        <p className="text-13 text-muted">
          {count > 0 ? `${count}명 근무` : "배정된 근무가 없습니다."}
        </p>
      </div>
      {hint ? <p className="mt-1 text-13 text-muted">{hint}</p> : null}
    </div>
  );
}
