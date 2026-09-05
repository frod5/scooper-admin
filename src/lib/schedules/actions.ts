"use server";

import { revalidatePath } from "next/cache";
import { requireEmployee, requireStaff } from "@/lib/auth/session";
import {
  DEFAULT_END,
  DEFAULT_START,
  changeRequestBlockReason,
  eachISODate,
  formatTime,
  monthBounds,
  requestedDateBlockReason,
  timeToMinutes,
} from "@/lib/datetime";
import { NETWORK_ERROR, isDuplicateError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  encodeDateMoveReason,
  parseRequestedDate,
  visibleChangeReason,
} from "@/lib/schedules/date-move";
import {
  notifyEmployeeOfChangeDecision,
  notifyStaffOfChangeRequest,
} from "@/lib/push/send";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type {
  ActionResult,
  AssignableEmployee,
  ChangeRequest,
  MonthScheduleData,
  RequestStatus,
  UserStatus,
  WorkAssignment,
} from "@/lib/types";

type ProfileRow = {
  id: string;
  name: string;
  status: UserStatus;
  branch_id: string | null;
  branches: { name: string } | { name: string }[] | null;
};

type ScheduleRow = {
  id: string;
  user_id: string;
  work_date: string;
  start_time: string;
  end_time: string;
};

type RequestRow = {
  id: string;
  user_id: string;
  work_date: string;
  requested_start: string;
  requested_end: string;
  reason: string | null;
  status: RequestStatus;
  reviewed_by: string | null;
};

function branchNameOf(value: ProfileRow["branches"]) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0]?.name ?? null;
  return value.name ?? null;
}

function asDate(value: string) {
  return String(value).slice(0, 10);
}

async function profilesByIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[],
) {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, ProfileRow>();
  if (unique.length === 0) return map;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, status, branch_id, branches ( name )")
    .in("id", unique);
  if (error) throw error;
  for (const row of (data ?? []) as ProfileRow[]) {
    map.set(row.id, row);
  }
  return map;
}

function toAssignment(
  row: ScheduleRow,
  profile: ProfileRow | undefined,
): WorkAssignment {
  return {
    id: row.id,
    user_id: row.user_id,
    work_date: asDate(row.work_date),
    start_time: formatTime(row.start_time),
    end_time: formatTime(row.end_time),
    name: profile?.name ?? "",
    status: profile?.status ?? "active",
    branch_id: profile?.branch_id ?? null,
    branch_name: branchNameOf(profile?.branches ?? null),
  };
}

function toRequest(
  row: RequestRow,
  profile: ProfileRow | undefined,
  reviewerName: string | null,
  current: WorkAssignment | undefined,
): ChangeRequest {
  const workDate = asDate(row.work_date);
  const requestedDate = parseRequestedDate(row.reason, workDate);
  return {
    id: row.id,
    user_id: row.user_id,
    work_date: workDate,
    requested_date: requestedDate,
    requested_start: formatTime(row.requested_start),
    requested_end: formatTime(row.requested_end),
    reason: visibleChangeReason(row.reason, requestedDate !== workDate),
    status: row.status,
    reviewed_by: row.reviewed_by,
    reviewer_name: reviewerName,
    name: profile?.name ?? "",
    branch_id: profile?.branch_id ?? null,
    branch_name: branchNameOf(profile?.branches ?? null),
    current_start: current?.start_time ?? null,
    current_end: current?.end_time ?? null,
  };
}

async function loadMonth(
  supabase: Awaited<ReturnType<typeof createClient>>,
  year: number,
  month: number,
): Promise<MonthScheduleData> {
  const { start, end } = monthBounds(year, month);
  const { data: scheduleRows, error: scheduleError } = await supabase
    .from("work_schedules")
    .select("id, user_id, work_date, start_time, end_time")
    .gte("work_date", start)
    .lte("work_date", end)
    .order("start_time");
  if (scheduleError) throw scheduleError;

  const { data: requestRows, error: requestError } = await supabase
    .from("schedule_change_requests")
    .select(
      "id, user_id, work_date, requested_start, requested_end, reason, status, reviewed_by",
    )
    .gte("work_date", start)
    .lte("work_date", end)
    .order("work_date");
  if (requestError) throw requestError;

  const schedules = (scheduleRows ?? []) as ScheduleRow[];
  const requests = (requestRows ?? []) as RequestRow[];
  const profileIds = [
    ...schedules.map((row) => row.user_id),
    ...requests.map((row) => row.user_id),
    ...requests.map((row) => row.reviewed_by ?? ""),
  ];
  const profiles = await profilesByIds(supabase, profileIds);
  const assignments = schedules.map((row) =>
    toAssignment(row, profiles.get(row.user_id)),
  );
  const assignmentKey = new Map(
    assignments.map((item) => [`${item.user_id}:${item.work_date}`, item]),
  );

  return {
    assignments,
    requests: requests.map((row) =>
      toRequest(
        row,
        profiles.get(row.user_id),
        row.reviewed_by ? (profiles.get(row.reviewed_by)?.name ?? null) : null,
        assignmentKey.get(`${row.user_id}:${asDate(row.work_date)}`),
      ),
    ),
  };
}

function filterByBranch(data: MonthScheduleData, branchId: string | "all") {
  if (branchId === "all") return data;
  return {
    assignments: data.assignments.filter((item) => item.branch_id === branchId),
    requests: data.requests.filter((item) => item.branch_id === branchId),
  };
}

export async function listEmployeeMonthAction(
  year: number,
  month: number,
): Promise<ActionResult<MonthScheduleData>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  await requireEmployee();
  try {
    const supabase = await createClient();
    const data = await loadMonth(supabase, year, month);
    return { ok: true, data };
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}

export async function listAdminMonthAction(
  year: number,
  month: number,
  branchId: string | "all",
): Promise<ActionResult<MonthScheduleData>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  await requireStaff();
  try {
    const supabase = await createClient();
    const data = filterByBranch(await loadMonth(supabase, year, month), branchId);
    return { ok: true, data };
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}

export async function countPendingChangeRequestsAction(): Promise<
  ActionResult<number>
> {
  if (!getSupabasePublicEnv()) return { ok: true, data: 0 };
  await requireStaff();
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("schedule_change_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) return { ok: false, error: NETWORK_ERROR };
  return { ok: true, data: count ?? 0 };
}

export async function listPendingChangeRequestsAction(): Promise<
  ActionResult<ChangeRequest[]>
> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  await requireStaff();
  const supabase = await createClient();
  const { data: requestRows, error } = await supabase
    .from("schedule_change_requests")
    .select(
      "id, user_id, work_date, requested_start, requested_end, reason, status, reviewed_by",
    )
    .eq("status", "pending")
    .order("work_date", { ascending: true });
  if (error) return { ok: false, error: NETWORK_ERROR };

  const rows = (requestRows ?? []) as RequestRow[];
  try {
    const profiles = await profilesByIds(supabase, [
      ...rows.map((row) => row.user_id),
      ...rows.map((row) => row.reviewed_by ?? ""),
    ]);
    const dates = [...new Set(rows.map((row) => asDate(row.work_date)))];
    const { data: scheduleRows } = dates.length
      ? await supabase
          .from("work_schedules")
          .select("id, user_id, work_date, start_time, end_time")
          .in("work_date", dates)
      : { data: [] };
    const assignments = ((scheduleRows ?? []) as ScheduleRow[]).map((row) =>
      toAssignment(row, profiles.get(row.user_id)),
    );
    const assignmentKey = new Map(
      assignments.map((item) => [`${item.user_id}:${item.work_date}`, item]),
    );
    const mapped = rows.map((row) =>
      toRequest(
        row,
        profiles.get(row.user_id),
        row.reviewed_by ? (profiles.get(row.reviewed_by)?.name ?? null) : null,
        assignmentKey.get(`${row.user_id}:${asDate(row.work_date)}`),
      ),
    );
    return { ok: true, data: mapped };
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}

export async function listAssignableEmployeesAction(
  branchId: string,
  workDate?: string | null,
): Promise<ActionResult<AssignableEmployee[]>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  await requireStaff();
  const supabase = await createClient();
  const { data: employees, error } = await supabase
    .from("profiles")
    .select("id, name, status")
    .eq("role", "employee")
    .eq("branch_id", branchId)
    .eq("status", "active")
    .order("name");
  if (error) return { ok: false, error: NETWORK_ERROR };

  if (!workDate) {
    return { ok: true, data: (employees ?? []) as AssignableEmployee[] };
  }

  const { data: assigned, error: assignedError } = await supabase
    .from("work_schedules")
    .select("user_id")
    .eq("work_date", workDate);
  if (assignedError) return { ok: false, error: NETWORK_ERROR };

  const taken = new Set((assigned ?? []).map((row) => row.user_id as string));
  return {
    ok: true,
    data: ((employees ?? []) as AssignableEmployee[]).filter(
      (person) => !taken.has(person.id),
    ),
  };
}

export async function createChangeRequestAction(input: {
  workDate: string;
  requestedStart: string;
  requestedEnd: string;
  reason: string;
  requestedDate?: string;
}): Promise<ActionResult<ChangeRequest>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  const profile = await requireEmployee();
  const start = formatTime(input.requestedStart);
  const end = formatTime(input.requestedEnd);
  if (timeToMinutes(end) <= timeToMinutes(start)) {
    return { ok: false, error: "종료 시간은 시작 이후여야 합니다." };
  }

  const supabase = await createClient();
  const { data: schedule, error: scheduleError } = await supabase
    .from("work_schedules")
    .select("id, user_id, work_date, start_time, end_time")
    .eq("user_id", profile.id)
    .eq("work_date", input.workDate)
    .maybeSingle();
  if (scheduleError) return { ok: false, error: NETWORK_ERROR };
  if (!schedule) {
    return { ok: false, error: "이 날은 배정된 근무자가 없습니다." };
  }

  const currentStart = formatTime(schedule.start_time as string);
  const currentEnd = formatTime(schedule.end_time as string);
  const blocked = changeRequestBlockReason(
    asDate(schedule.work_date as string),
    currentStart,
  );
  if (blocked) {
    return { ok: false, error: blocked };
  }
  const currentDate = asDate(schedule.work_date as string);
  const requestedDate = input.requestedDate
    ? asDate(input.requestedDate)
    : currentDate;
  const dateMove = requestedDate !== currentDate;
  const targetBlocked = requestedDateBlockReason(requestedDate, start);
  if (targetBlocked) return { ok: false, error: targetBlocked };
  if (dateMove) {
    const { data: taken } = await supabase
      .from("work_schedules")
      .select("id")
      .eq("user_id", profile.id)
      .eq("work_date", requestedDate)
      .maybeSingle();
    if (taken) {
      return { ok: false, error: "그 날 이미 배정된 근무가 있습니다." };
    }
  }
  if (start === currentStart && end === currentEnd && !dateMove) {
    return { ok: false, error: "변경 내용이 없습니다." };
  }

  const { data: existing } = await supabase
    .from("schedule_change_requests")
    .select("id")
    .eq("user_id", profile.id)
    .eq("work_date", input.workDate)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) {
    return { ok: false, error: "대기 중인 변경 요청이 있습니다" };
  }

  const note = input.reason.trim();
  const { data, error } = await supabase
    .from("schedule_change_requests")
    .insert({
      user_id: profile.id,
      work_date: input.workDate,
      requested_start: start,
      requested_end: end,
      reason: dateMove
        ? encodeDateMoveReason(currentDate, requestedDate, note)
        : note
          ? note
          : null,
      status: "pending",
    })
    .select(
      "id, user_id, work_date, requested_start, requested_end, reason, status, reviewed_by",
    )
    .single();
  if (error) return { ok: false, error: NETWORK_ERROR };

  try {
    await notifyStaffOfChangeRequest({
      employeeName: profile.name,
      excludeUserId: profile.id,
    });
  } catch {
    // 요청 저장은 유지. 알림은 실패해도 됨.
  }

  revalidatePath("/app");
  revalidatePath("/app/requests");
  revalidatePath("/app/notifications");
  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  revalidatePath("/admin/notifications");
  revalidatePath("/admin/schedules");
  const row = data as RequestRow;
  return {
    ok: true,
    data: toRequest(
      row,
      {
        id: profile.id,
        name: profile.name,
        status: profile.status,
        branch_id: profile.branch_id,
        branches: profile.branch_name ? { name: profile.branch_name } : null,
      },
      null,
      {
        id: schedule.id as string,
        user_id: profile.id,
        work_date: currentDate,
        start_time: currentStart,
        end_time: currentEnd,
        name: profile.name,
        status: profile.status,
        branch_id: profile.branch_id,
        branch_name: profile.branch_name,
      },
    ),
  };
}

export async function moveAssignmentAction(input: {
  id: string;
  workDate: string;
}): Promise<ActionResult<WorkAssignment>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  await requireStaff();
  const workDate = asDate(input.workDate);
  const supabase = await createClient();
  const { data: current, error: loadError } = await supabase
    .from("work_schedules")
    .select("id, user_id, work_date, start_time, end_time")
    .eq("id", input.id)
    .maybeSingle();
  if (loadError || !current) return { ok: false, error: NETWORK_ERROR };
  const row = current as ScheduleRow;
  if (asDate(row.work_date) === workDate) {
    try {
      const profiles = await profilesByIds(supabase, [row.user_id]);
      return { ok: true, data: toAssignment(row, profiles.get(row.user_id)) };
    } catch {
      return { ok: false, error: NETWORK_ERROR };
    }
  }

  const { data, error } = await supabase
    .from("work_schedules")
    .update({ work_date: workDate })
    .eq("id", input.id)
    .select("id, user_id, work_date, start_time, end_time")
    .single();
  if (error) {
    if (isDuplicateError(error)) {
      return { ok: false, error: "그 날 이미 배정된 근무가 있습니다." };
    }
    return { ok: false, error: NETWORK_ERROR };
  }
  try {
    const next = data as ScheduleRow;
    const profiles = await profilesByIds(supabase, [next.user_id]);
    revalidatePath("/app");
    revalidatePath("/app/requests");
    revalidatePath("/admin");
    revalidatePath("/admin/schedules");
    return { ok: true, data: toAssignment(next, profiles.get(next.user_id)) };
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}

export async function assignEmployeeAction(input: {
  userId: string;
  workDate: string;
}): Promise<ActionResult<WorkAssignment>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_schedules")
    .insert({
      user_id: input.userId,
      work_date: input.workDate,
      start_time: DEFAULT_START,
      end_time: DEFAULT_END,
    })
    .select("id, user_id, work_date, start_time, end_time")
    .single();
  if (error) {
    if (isDuplicateError(error)) {
      return { ok: false, error: NETWORK_ERROR };
    }
    return { ok: false, error: NETWORK_ERROR };
  }
  try {
    const profiles = await profilesByIds(supabase, [input.userId]);
    revalidatePath("/app");
    revalidatePath("/admin");
    revalidatePath("/admin/schedules");
    return {
      ok: true,
      data: toAssignment(data as ScheduleRow, profiles.get(input.userId)),
    };
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}

export async function assignEmployeeRangeAction(input: {
  userId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}): Promise<ActionResult<WorkAssignment[]>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  await requireStaff();
  const startDate = asDate(input.startDate);
  const endDate = asDate(input.endDate);
  const start = formatTime(input.startTime);
  const end = formatTime(input.endTime);
  if (timeToMinutes(end) <= timeToMinutes(start)) {
    return { ok: false, error: "종료 시간은 시작 이후여야 합니다." };
  }
  const dates = eachISODate(startDate, endDate);
  if (dates.length === 0) {
    return { ok: false, error: "날짜를 확인하세요." };
  }
  if (dates.length > 62) {
    return { ok: false, error: "기간이 너무 깁니다." };
  }

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("work_schedules")
    .select("work_date")
    .eq("user_id", input.userId)
    .gte("work_date", dates[0])
    .lte("work_date", dates[dates.length - 1]);
  if (existingError) return { ok: false, error: NETWORK_ERROR };

  const taken = new Set(
    (existing ?? []).map((row) => asDate(row.work_date as string)),
  );
  const toInsert = dates.filter((date) => !taken.has(date));
  if (toInsert.length === 0) {
    return { ok: false, error: "그 기간에 이미 배정된 근무가 있습니다." };
  }

  const { data, error } = await supabase
    .from("work_schedules")
    .insert(
      toInsert.map((workDate) => ({
        user_id: input.userId,
        work_date: workDate,
        start_time: start,
        end_time: end,
      })),
    )
    .select("id, user_id, work_date, start_time, end_time");
  if (error) {
    if (isDuplicateError(error)) {
      return { ok: false, error: "그 기간에 이미 배정된 근무가 있습니다." };
    }
    return { ok: false, error: NETWORK_ERROR };
  }

  try {
    const profiles = await profilesByIds(supabase, [input.userId]);
    revalidatePath("/app");
    revalidatePath("/app/requests");
    revalidatePath("/admin");
    revalidatePath("/admin/schedules");
    return {
      ok: true,
      data: ((data ?? []) as ScheduleRow[]).map((row) =>
        toAssignment(row, profiles.get(input.userId)),
      ),
    };
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}

export async function updateAssignmentTimeAction(input: {
  id: string;
  startTime: string;
  endTime: string;
  userId?: string;
}): Promise<ActionResult<WorkAssignment>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  await requireStaff();
  const start = formatTime(input.startTime);
  const end = formatTime(input.endTime);
  if (timeToMinutes(end) <= timeToMinutes(start)) {
    return { ok: false, error: "종료 시간은 시작 이후여야 합니다." };
  }
  const supabase = await createClient();
  const patch: {
    start_time: string;
    end_time: string;
    user_id?: string;
  } = { start_time: start, end_time: end };
  if (input.userId) patch.user_id = input.userId;
  const { data, error } = await supabase
    .from("work_schedules")
    .update(patch)
    .eq("id", input.id)
    .select("id, user_id, work_date, start_time, end_time")
    .single();
  if (error) {
    if (isDuplicateError(error)) {
      return { ok: false, error: "그 날 이미 배정된 근무가 있습니다." };
    }
    return { ok: false, error: NETWORK_ERROR };
  }
  try {
    const row = data as ScheduleRow;
    const profiles = await profilesByIds(supabase, [row.user_id]);
    revalidatePath("/app");
    revalidatePath("/admin");
    revalidatePath("/admin/schedules");
    return { ok: true, data: toAssignment(row, profiles.get(row.user_id)) };
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}

export async function removeAssignmentAction(
  id: string,
): Promise<ActionResult<null>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("work_schedules").delete().eq("id", id);
  if (error) return { ok: false, error: NETWORK_ERROR };
  revalidatePath("/app");
  revalidatePath("/app/requests");
  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  revalidatePath("/admin/schedules");
  return { ok: true, data: null };
}

export async function approveChangeRequestAction(
  id: string,
): Promise<ActionResult<ChangeRequest>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  const staff = await requireStaff();
  const supabase = await createClient();
  const { data: request, error: loadError } = await supabase
    .from("schedule_change_requests")
    .select(
      "id, user_id, work_date, requested_start, requested_end, reason, status, reviewed_by",
    )
    .eq("id", id)
    .maybeSingle();
  if (loadError || !request) return { ok: false, error: NETWORK_ERROR };
  const row = request as RequestRow;
  if (row.status !== "pending") return { ok: false, error: NETWORK_ERROR };

  const start = formatTime(row.requested_start);
  const end = formatTime(row.requested_end);
  const workDate = asDate(row.work_date);
  const targetDate = parseRequestedDate(row.reason, workDate);

  const { data: existing } = await supabase
    .from("work_schedules")
    .select("id")
    .eq("user_id", row.user_id)
    .eq("work_date", workDate)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("work_schedules")
      .update({
        work_date: targetDate,
        start_time: start,
        end_time: end,
      })
      .eq("id", existing.id);
    if (error) {
      if (isDuplicateError(error)) {
        return { ok: false, error: "그 날 이미 배정된 근무가 있습니다." };
      }
      return { ok: false, error: NETWORK_ERROR };
    }
  } else {
    const { error } = await supabase.from("work_schedules").insert({
      user_id: row.user_id,
      work_date: targetDate,
      start_time: start,
      end_time: end,
    });
    if (error) {
      if (isDuplicateError(error)) {
        return { ok: false, error: "그 날 이미 배정된 근무가 있습니다." };
      }
      return { ok: false, error: NETWORK_ERROR };
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("schedule_change_requests")
    .update({ status: "approved", reviewed_by: staff.id })
    .eq("id", id)
    .select(
      "id, user_id, work_date, requested_start, requested_end, reason, status, reviewed_by",
    )
    .single();
  if (updateError) return { ok: false, error: NETWORK_ERROR };

  try {
    await notifyEmployeeOfChangeDecision({
      userId: row.user_id,
      approved: true,
    });
  } catch {
    // 승인은 유지. 알림은 실패해도 됨.
  }

  try {
    const next = updated as RequestRow;
    const profiles = await profilesByIds(supabase, [next.user_id, staff.id]);
    revalidatePath("/app");
    revalidatePath("/app/requests");
    revalidatePath("/app/notifications");
    revalidatePath("/admin");
    revalidatePath("/admin/requests");
    revalidatePath("/admin/notifications");
    revalidatePath("/admin/schedules");
    return {
      ok: true,
      data: toRequest(
        next,
        profiles.get(next.user_id),
        staff.name,
        {
          id: "",
          user_id: next.user_id,
          work_date: workDate,
          start_time: start,
          end_time: end,
          name: profiles.get(next.user_id)?.name ?? "",
          status: "active",
          branch_id: profiles.get(next.user_id)?.branch_id ?? null,
          branch_name: branchNameOf(
            profiles.get(next.user_id)?.branches ?? null,
          ),
        },
      ),
    };
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}

export async function cancelChangeRequestAction(
  id: string,
): Promise<ActionResult<null>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  const profile = await requireEmployee();
  const supabase = await createClient();
  const { data: row, error: loadError } = await supabase
    .from("schedule_change_requests")
    .select("id, status")
    .eq("id", id)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (loadError) return { ok: false, error: NETWORK_ERROR };
  if (!row || (row.status as RequestStatus) !== "pending") {
    return { ok: false, error: "취소할 요청이 없습니다." };
  }

  const { data: deleted, error } = await supabase
    .from("schedule_change_requests")
    .delete()
    .eq("id", id)
    .eq("user_id", profile.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (error || !deleted) {
    try {
      const admin = createAdminClient();
      const { error: adminError } = await admin
        .from("schedule_change_requests")
        .delete()
        .eq("id", id)
        .eq("user_id", profile.id)
        .eq("status", "pending");
      if (adminError) return { ok: false, error: NETWORK_ERROR };
    } catch {
      return { ok: false, error: NETWORK_ERROR };
    }
  }

  revalidatePath("/app");
  revalidatePath("/app/requests");
  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  return { ok: true, data: null };
}

export async function rejectChangeRequestAction(
  id: string,
): Promise<ActionResult<ChangeRequest>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  const staff = await requireStaff();
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("schedule_change_requests")
    .update({ status: "rejected", reviewed_by: staff.id })
    .eq("id", id)
    .eq("status", "pending")
    .select(
      "id, user_id, work_date, requested_start, requested_end, reason, status, reviewed_by",
    )
    .single();
  if (error) return { ok: false, error: NETWORK_ERROR };
  try {
    const next = updated as RequestRow;
    try {
      await notifyEmployeeOfChangeDecision({
        userId: next.user_id,
        approved: false,
      });
    } catch {
      // 거절은 유지. 알림은 실패해도 됨.
    }
    const profiles = await profilesByIds(supabase, [next.user_id, staff.id]);
    revalidatePath("/app");
    revalidatePath("/app/requests");
    revalidatePath("/app/notifications");
    revalidatePath("/admin");
    revalidatePath("/admin/requests");
    revalidatePath("/admin/notifications");
    revalidatePath("/admin/schedules");
    return {
      ok: true,
      data: toRequest(next, profiles.get(next.user_id), staff.name, undefined),
    };
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}
