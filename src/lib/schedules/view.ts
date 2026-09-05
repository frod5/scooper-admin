import { canRequestChange } from "@/lib/datetime";
import type { ChangeRequest, WorkAssignment } from "@/lib/types";

export function activeOnDate(assignments: WorkAssignment[], date: string) {
  return assignments.filter(
    (item) => item.work_date === date && item.status === "active",
  );
}

export function assignmentsOnDate(assignments: WorkAssignment[], date: string) {
  return assignments.filter((item) => item.work_date === date);
}

export function sortMineFirst(assignments: WorkAssignment[], myUserId?: string) {
  return [...assignments].sort((a, b) => {
    if (myUserId) {
      if (a.user_id === myUserId && b.user_id !== myUserId) return -1;
      if (b.user_id === myUserId && a.user_id !== myUserId) return 1;
    }
    const time = a.start_time.localeCompare(b.start_time);
    if (time !== 0) return time;
    return a.name.localeCompare(b.name, "ko");
  });
}

export const CHIP_TINT_COUNT = 12;

export function chipTint(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return hash % CHIP_TINT_COUNT;
}

export function buildChipTintMap(
  userIds: Iterable<string>,
  myUserId?: string,
) {
  const unique = [...new Set(userIds)].filter(
    (id) => Boolean(id) && id !== myUserId,
  );
  unique.sort();
  const map = new Map<string, number>();
  unique.forEach((id, index) => {
    map.set(id, index % CHIP_TINT_COUNT);
  });
  return map;
}

export function displayName(assignment: WorkAssignment, myUserId?: string) {
  return myUserId && assignment.user_id === myUserId ? "나" : assignment.name;
}

export function canDropShiftOnDate(
  assignment: WorkAssignment,
  targetDate: string,
  assignments: WorkAssignment[],
  options: {
    asStaff: boolean;
    hasPending: boolean;
    now?: Date;
  },
) {
  if (assignment.work_date === targetDate) return false;
  const occupied = assignments.some(
    (item) =>
      item.user_id === assignment.user_id &&
      item.work_date === targetDate &&
      item.id !== assignment.id,
  );
  if (occupied) return false;
  if (options.asStaff) return true;
  if (options.hasPending) return false;
  if (!canRequestChange(assignment.work_date, assignment.start_time, options.now)) {
    return false;
  }
  return canRequestChange(targetDate, assignment.start_time, options.now);
}

export function pendingOnDate(requests: ChangeRequest[], date: string) {
  return requests.filter(
    (item) => item.work_date === date && item.status === "pending",
  );
}

export function myPendingOnDate(
  requests: ChangeRequest[],
  date: string,
  myUserId: string,
) {
  return pendingOnDate(requests, date).find((item) => item.user_id === myUserId);
}

export function buildCalendarDays(
  assignments: WorkAssignment[],
  requests: ChangeRequest[],
  myUserId?: string,
) {
  const dates = new Set<string>();
  for (const item of assignments) dates.add(item.work_date);
  for (const item of requests) dates.add(item.work_date);
  const days: Record<
    string,
    {
      names: { userId: string; name: string; isMine?: boolean }[];
      count: number;
      pendingCount: number;
      minePending?: boolean;
      isMine?: boolean;
    }
  > = {};
  for (const date of dates) {
    const active = sortMineFirst(activeOnDate(assignments, date), myUserId);
    const pending = pendingOnDate(requests, date);
    days[date] = {
      names: active.map((item) => ({
        userId: item.user_id,
        name: displayName(item, myUserId),
        isMine: Boolean(myUserId && item.user_id === myUserId),
        assignmentId: item.id,
      })),
      count: active.length,
      pendingCount: pending.length,
      minePending: Boolean(myUserId && myPendingOnDate(requests, date, myUserId)),
      isMine: Boolean(myUserId && active.some((item) => item.user_id === myUserId)),
    };
  }
  return days;
}
