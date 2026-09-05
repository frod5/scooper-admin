import { EmployeeRequestsPage } from "@/components/requests/EmployeeRequestsPage";
import { requireEmployee } from "@/lib/auth/session";
import { shiftMonth, yearMonthNow } from "@/lib/datetime";
import { listEmployeeMonthAction } from "@/lib/schedules/actions";
import type {
  ChangeRequest,
  InventoryMemo,
  MonthScheduleData,
  WorkAssignment,
} from "@/lib/types";

export const dynamic = "force-dynamic";

function mergeMonths(parts: MonthScheduleData[]): MonthScheduleData {
  const assignments = new Map<string, WorkAssignment>();
  const requests = new Map<string, ChangeRequest>();
  const memos = new Map<string, InventoryMemo>();
  for (const part of parts) {
    for (const item of part.assignments) assignments.set(item.id, item);
    for (const item of part.requests) requests.set(item.id, item);
    for (const item of part.inventoryMemos ?? []) memos.set(item.id, item);
  }
  return {
    assignments: [...assignments.values()],
    requests: [...requests.values()],
    inventoryMemos: [...memos.values()],
  };
}

export default async function Page() {
  const profile = await requireEmployee();
  const now = yearMonthNow();
  const prev = shiftMonth(now.year, now.month, -1);
  const next = shiftMonth(now.year, now.month, 1);
  const results = await Promise.all([
    listEmployeeMonthAction(prev.year, prev.month),
    listEmployeeMonthAction(now.year, now.month),
    listEmployeeMonthAction(next.year, next.month),
  ]);
  const failed = results.some((result) => !result.ok);
  const data = mergeMonths(
    results
      .filter(
        (result): result is { ok: true; data: MonthScheduleData } => result.ok,
      )
      .map((result) => result.data),
  );

  return (
    <EmployeeRequestsPage
      userId={profile.id}
      initialData={data}
      loadError={failed ? "일정을 불러오지 못했습니다." : undefined}
    />
  );
}
