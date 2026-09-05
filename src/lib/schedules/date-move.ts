import { shortDayLabel, toISODate } from "@/lib/datetime";

const DATE_MARKER = "DATE:";

export function encodeDateMoveReason(from: string, to: string, note: string) {
  const visible = `근무일 ${shortDayLabel(from)} → ${shortDayLabel(to)}`;
  const body = note ? `${visible} · ${note}` : visible;
  return `${DATE_MARKER}${to}\n${body}`;
}

export function parseRequestedDate(reason: string | null, fromDate: string) {
  if (!reason) return fromDate;
  const iso = reason.match(/DATE:(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const korean = reason.match(
    /근무일\s+\d+월\s+\d+일\s+→\s+(\d+)월\s+(\d+)일/,
  );
  if (!korean) return fromDate;
  const month = Number(korean[1]);
  const day = Number(korean[2]);
  const [year, fromMonth] = fromDate.split("-").map(Number);
  const targetYear = month < fromMonth ? year + 1 : year;
  return toISODate(targetYear, month, day);
}

export function visibleChangeReason(reason: string | null, dateMoved: boolean) {
  if (!reason) return null;
  let text = reason.replace(/^DATE:\d{4}-\d{2}-\d{2}\n?/, "");
  if (dateMoved) {
    text = text.replace(
      /^근무일\s+\d+월\s+\d+일\s+→\s+\d+월\s+\d+일(?:\s+·\s+)?/,
      "",
    );
  }
  text = text.trim();
  return text || null;
}
