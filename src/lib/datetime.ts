export const SEOUL_TZ = "Asia/Seoul";
export const DEFAULT_START = "11:00";
export const DEFAULT_END = "21:00";

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function todayISO(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function yearMonthNow(now = new Date()) {
  const iso = todayISO(now);
  const [year, month] = iso.split("-").map(Number);
  return { year, month };
}

export function toISODate(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function addDaysISO(iso: string, delta: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day + delta);
  return toISODate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function eachISODate(from: string, to: string) {
  const start = from <= to ? from : to;
  const end = from <= to ? to : from;
  const dates: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    dates.push(cursor);
    cursor = addDaysISO(cursor, 1);
  }
  return dates;
}

export function weekContaining(iso: string) {
  const start = addDaysISO(iso, -weekdayIndex(iso));
  return Array.from({ length: 7 }, (_, index) => addDaysISO(start, index));
}

export function isoYearMonth(iso: string) {
  const [year, month] = iso.split("-").map(Number);
  return { year, month };
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function monthBounds(year: number, month: number) {
  return {
    start: toISODate(year, month, 1),
    end: toISODate(year, month, daysInMonth(year, month)),
  };
}

export function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function monthLabel(year: number, month: number) {
  return `${year}년 ${month}월`;
}

export function weekdayIndex(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

export function dayTitle(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const weekday = WEEKDAY_LABELS[new Date(year, month - 1, day).getDay()];
  return `${month}월 ${day}일 ${weekday}요일`;
}

export function shortDayLabel(iso: string) {
  const [, month, day] = iso.split("-").map(Number);
  return `${month}월 ${day}일`;
}

export function formatNoticeStamp(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SEOUL_TZ,
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${Number(get("month"))}월 ${Number(get("day"))}일 ${get("hour")}:${get("minute")}`;
}

export function formatTime(value: string) {
  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) return DEFAULT_START;
  return `${pad2(Number(match[1]))}:${match[2]}`;
}

export function defaultShiftTime(
  value: string | null | undefined,
  fallback: string,
  legacy: string,
) {
  if (!value) return fallback;
  const time = formatTime(value);
  return time === legacy ? fallback : time;
}

export function formatTimeRange(start: string, end: string) {
  return `${formatTime(start)}–${formatTime(end)}`;
}

export function timeToMinutes(value: string) {
  const [hours, minutes] = formatTime(value).split(":").map(Number);
  return hours * 60 + minutes;
}

export function seoulNowMinutes(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SEOUL_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0") % 24;
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

export function canRequestChange(
  workDate: string,
  startTime: string,
  now: Date = new Date(),
) {
  const today = todayISO(now);
  if (workDate < today) return false;
  if (workDate === today && seoulNowMinutes(now) >= timeToMinutes(startTime)) {
    return false;
  }
  return true;
}

export function changeRequestBlockReason(
  workDate: string,
  startTime: string,
  now: Date = new Date(),
) {
  if (canRequestChange(workDate, startTime, now)) return null;
  if (workDate < todayISO(now)) return "지난 근무는 변경할 수 없습니다.";
  return "이미 시작된 근무는 변경할 수 없습니다.";
}

export function requestedDateBlockReason(
  workDate: string,
  startTime: string,
  now: Date = new Date(),
) {
  if (canRequestChange(workDate, startTime, now)) return null;
  if (workDate < todayISO(now)) return "지난 날짜로는 변경할 수 없습니다.";
  return "이미 지난 시간으로는 변경할 수 없습니다.";
}

export function hoursLabel(start: string, end: string) {
  const minutes = timeToMinutes(end) - timeToMinutes(start);
  const hours = Math.max(0, Math.round(minutes / 60));
  return `${hours}시간`;
}

export type MonthCell = {
  date: string | null;
  day: number | null;
  weekday: number;
};

export function buildMonthGrid(year: number, month: number): MonthCell[] {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const count = daysInMonth(year, month);
  const cells: MonthCell[] = [];
  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({ date: null, day: null, weekday: index });
  }
  for (let day = 1; day <= count; day += 1) {
    const date = toISODate(year, month, day);
    cells.push({ date, day, weekday: weekdayIndex(date) });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, day: null, weekday: cells.length % 7 });
  }
  return cells;
}
