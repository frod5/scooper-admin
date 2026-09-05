"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AgendaList } from "@/components/calendar/AgendaList";
import { ChipTintProvider } from "@/components/calendar/EventChip";
import {
  CalendarMonth,
  CalendarSkeleton,
} from "@/components/calendar/CalendarMonth";
import { ChangeRequestCard } from "@/components/calendar/ChangeRequestCard";
import { PendingBar } from "@/components/calendar/PendingBar";
import { PendingListSheet } from "@/components/calendar/PendingListSheet";
import { ShiftDndProvider } from "@/components/calendar/ShiftDnd";
import { ShiftSheet } from "@/components/calendar/ShiftSheet";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { DangerButton } from "@/components/ui/DangerButton";
import { Dialog } from "@/components/ui/Dialog";
import { GhostButton } from "@/components/ui/GhostButton";
import { HintTooltip } from "@/components/ui/HintTooltip";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { FAB } from "@/components/ui/FAB";
import { FilterChips } from "@/components/ui/FilterChips";
import { ListRow } from "@/components/ui/ListRow";
import { MonthSwitcher } from "@/components/ui/MonthSwitcher";
import { NoticeToast } from "@/components/ui/NoticeToast";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";

import {
  canRequestChange,
  changeRequestBlockReason,
  isoYearMonth,
  shortDayLabel,
  toISODate,
  todayISO,
  yearMonthNow,
} from "@/lib/datetime";
import {
  approveChangeRequestAction,
  assignEmployeeRangeAction,
  cancelChangeRequestAction,
  createChangeRequestAction,
  listAdminMonthAction,
  listAssignableEmployeesAction,
  listEmployeeMonthAction,
  moveAssignmentAction,
  rejectChangeRequestAction,
  removeAssignmentAction,
  updateAssignmentTimeAction,
} from "@/lib/schedules/actions";
import {
  assignmentsOnDate,
  buildCalendarDays,
  canDropShiftOnDate,
  displayName,
  myPendingOnDate,
  pendingOnDate,
} from "@/lib/schedules/view";
import type {
  AssignableEmployee,
  Branch,
  ChangeRequest,
  DirectoryPerson,
  MonthScheduleData,
  Profile,
  WorkAssignment,
} from "@/lib/types";
import { ChangeRequestForm } from "@/components/schedule/ChangeRequestForm";

function workDayRows(
  people: DirectoryPerson[],
  assignments: WorkAssignment[],
  branchId: string,
) {
  const dates = new Map<string, Set<string>>();
  for (const item of assignments) {
    const set = dates.get(item.user_id) ?? new Set<string>();
    set.add(item.work_date);
    dates.set(item.user_id, set);
  }

  const employees = people.filter(
    (person) =>
      person.role === "employee" &&
      person.status === "active" &&
      (branchId === "all" || person.branch_id === branchId),
  );
  if (people.length > 0) {
    return employees.map((person) => ({
      id: person.id,
      name: person.name,
      branch_name: person.branch_name,
      days: dates.get(person.id)?.size ?? 0,
    }));
  }

  const seen = new Map<
    string,
    { id: string; name: string; branch_name: string | null }
  >();
  for (const item of assignments) {
    if (item.status !== "active") continue;
    if (!seen.has(item.user_id)) {
      seen.set(item.user_id, {
        id: item.user_id,
        name: item.name,
        branch_name: item.branch_name,
      });
    }
  }
  return [...seen.values()]
    .sort((a, b) => a.name.localeCompare(b.name, "ko"))
    .map((person) => ({
      ...person,
      days: dates.get(person.id)?.size ?? 0,
    }));
}

export function CalendarPage({
  mode,
  profile,
  initialBranches = [],
  initialPeople = [],
  initialYear,
  initialMonth,
  initialData,
  loadError,
}: {
  mode: "employee" | "admin";
  profile?: Profile;
  userName?: string;
  userRoleLabel?: string;
  initialBranches?: Branch[];
  initialPeople?: DirectoryPerson[];
  initialYear: number;
  initialMonth: number;
  initialData: MonthScheduleData;
  loadError?: string;
}) {
  const router = useRouter();
  const requestAnchor = useRef<HTMLDivElement | null>(null);
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [branchId, setBranchId] = useState("all");
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(loadError ?? "");
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [toast, setToast] = useState("");
  const [shiftOpen, setShiftOpen] = useState(false);
  const [editing, setEditing] = useState<WorkAssignment | null>(null);
  const [assignable, setAssignable] = useState<AssignableEmployee[]>([]);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [pendingSheetOpen, setPendingSheetOpen] = useState(false);
  const [canceling, setCanceling] = useState<ChangeRequest | null>(null);
  const [deleting, setDeleting] = useState<WorkAssignment | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    assignment: WorkAssignment;
    toDate: string;
  } | null>(null);
  const [moveBusy, setMoveBusy] = useState(false);

  const myUserId = profile?.id;
  const isStaff = mode === "admin";
  const days = buildCalendarDays(data.assignments, data.requests, myUserId);
  const dayAssignments = assignmentsOnDate(data.assignments, selectedDate);
  const dayPending = pendingOnDate(data.requests, selectedDate);
  const myPending =
    myUserId ? myPendingOnDate(data.requests, selectedDate, myUserId) : undefined;
  const myShift = dayAssignments.find(
    (item) => item.user_id === myUserId && item.status === "active",
  );
  const myChangeBlocked = myShift
    ? changeRequestBlockReason(myShift.work_date, myShift.start_time)
    : null;
  const myCanRequest = Boolean(
    !isStaff &&
      myShift &&
      !myPending &&
      canRequestChange(myShift.work_date, myShift.start_time),
  );
  const allPending = data.requests.filter((item) => item.status === "pending");
  const selectedBranchName =
    branchId === "all"
      ? undefined
      : initialBranches.find((branch) => branch.id === branchId)?.name;
  const requireBranch = isStaff && branchId === "all";

  const assignmentsById = useMemo(() => {
    const map = new Map<string, WorkAssignment>();
    for (const item of data.assignments) map.set(item.id, item);
    return map;
  }, [data.assignments]);

  const chipUserIds = useMemo(
    () => data.assignments.map((item) => item.user_id),
    [data.assignments],
  );

  const monthWorkDays = useMemo(() => {
    if (!isStaff && profile) {
      const dates = new Set<string>();
      for (const item of data.assignments) {
        if (item.user_id !== profile.id) continue;
        if (item.status !== "active") continue;
        dates.add(item.work_date);
      }
      return [
        {
          id: profile.id,
          name: profile.name,
          branch_name: profile.branch_name,
          days: dates.size,
        },
      ];
    }
    return workDayRows(initialPeople, data.assignments, branchId);
  }, [isStaff, profile, initialPeople, data.assignments, branchId]);

  const draggableIds = useMemo(() => {
    const ids = new Set<string>();
    for (const item of data.assignments) {
      if (item.status !== "active") continue;
      if (isStaff) {
        ids.add(item.id);
        continue;
      }
      if (!myUserId || item.user_id !== myUserId) continue;
      if (myPendingOnDate(data.requests, item.work_date, myUserId)) continue;
      if (canRequestChange(item.work_date, item.start_time)) ids.add(item.id);
    }
    return ids;
  }, [data.assignments, data.requests, isStaff, myUserId]);

  async function load(
    nextYear: number,
    nextMonth: number,
    nextBranch: string,
  ) {
    setLoading(true);
    const result = isStaff
      ? await listAdminMonthAction(
          nextYear,
          nextMonth,
          nextBranch === "all" ? "all" : nextBranch,
        )
      : await listEmployeeMonthAction(nextYear, nextMonth);
    setLoading(false);
    if (!result.ok) {
      setError("일정을 불러오지 못했습니다.");
      return;
    }
    setError("");
    setData(result.data);
  }

  function selectDate(iso: string) {
    setSelectedDate(iso);
    const next = isoYearMonth(iso);
    if (next.year !== year || next.month !== month) {
      setYear(next.year);
      setMonth(next.month);
      void load(next.year, next.month, branchId);
    }
  }

  const onDropShift = useCallback(
    (assignment: WorkAssignment, toDate: string) => {
      const hasPending = Boolean(
        myPendingOnDate(data.requests, assignment.work_date, assignment.user_id),
      );
      if (
        !canDropShiftOnDate(assignment, toDate, data.assignments, {
          asStaff: isStaff,
          hasPending,
        })
      ) {
        setError("그 날로 옮길 수 없습니다.");
        return;
      }
      setError("");
      setPendingMove({ assignment, toDate });
    },
    [data.assignments, data.requests, isStaff],
  );

  async function confirmMove() {
    if (!pendingMove) return;
    setMoveBusy(true);
    const { assignment, toDate } = pendingMove;
    if (isStaff) {
      const result = await moveAssignmentAction({
        id: assignment.id,
        workDate: toDate,
      });
      setMoveBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setData((current) => ({
        ...current,
        assignments: current.assignments.map((item) =>
          item.id === result.data.id ? result.data : item,
        ),
      }));
      setPendingMove(null);
      selectDate(toDate);
      setToast("변경했습니다.");
      return;
    }
    const result = await createChangeRequestAction({
      workDate: assignment.work_date,
      requestedStart: assignment.start_time,
      requestedEnd: assignment.end_time,
      reason: "",
      requestedDate: toDate,
    });
    setMoveBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPendingMove(null);
    setToast("변경 요청을 보냈습니다.");
    void load(year, month, branchId);
  }

  async function openAdd(branchForAdd?: string) {
    setEditing(null);
    const targetBranch = branchForAdd ?? (branchId === "all" ? "" : branchId);
    if (targetBranch) {
      const result = await listAssignableEmployeesAction(targetBranch);
      setAssignable(result.ok ? result.data : []);
    } else {
      setAssignable([]);
    }
    setShiftOpen(true);
  }

  async function openEdit(assignment: WorkAssignment) {
    setEditing(assignment);
    const targetBranch = assignment.branch_id ?? "";
    if (targetBranch) {
      const result = await listAssignableEmployeesAction(
        targetBranch,
        assignment.work_date,
      );
      const list = result.ok ? result.data : [];
      if (!list.some((person) => person.id === assignment.user_id)) {
        list.unshift({
          id: assignment.user_id,
          name: assignment.name,
          status: assignment.status,
        });
      }
      setAssignable(list);
    } else {
      setAssignable([
        {
          id: assignment.user_id,
          name: assignment.name,
          status: assignment.status,
        },
      ]);
    }
    setShiftOpen(true);
  }

  if (isStaff && initialBranches.length === 0 && !error) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyState
          message="지점을 먼저 추가하세요."
          action={
            <PrimaryButton
              className="w-auto px-6"
              onClick={() => router.push("/admin/settings/branches")}
            >
              지점 추가
            </PrimaryButton>
          }
        />
      </div>
    );
  }

  const agendaHint = myChangeBlocked
    ? myChangeBlocked
    : myPending
      ? "대기 중인 요청이 있습니다."
      : draggableIds.size > 0
        ? "근무를 길게 눌러 다른 날로 옮긴 뒤 변경을 확인하세요."
        : null;

  return (
    <ChipTintProvider userIds={chipUserIds} myUserId={myUserId}>
      <ShiftDndProvider myUserId={myUserId} onDrop={onDropShift}>
      <div className="-mx-4 flex flex-col">
        <div className="px-4 pb-3">
          <MonthSwitcher
            year={year}
            month={month}
            onChange={(nextYear, nextMonth) => {
              setYear(nextYear);
              setMonth(nextMonth);
              const now = yearMonthNow();
              if (now.year === nextYear && now.month === nextMonth) {
                setSelectedDate(todayISO());
              } else {
                setSelectedDate(toISODate(nextYear, nextMonth, 1));
              }
              void load(nextYear, nextMonth, branchId);
            }}
          />
        </div>

        <div className="flex flex-col gap-3 px-4 pt-3">
          {error ? (
            <ErrorBanner
              message={error}
              onRetry={() => void load(year, month, branchId)}
            />
          ) : null}
          {isStaff ? (
            <FilterChips
              options={[
                { value: "all", label: "전체" },
                ...initialBranches.map((branch) => ({
                  value: branch.id,
                  label: branch.name,
                })),
              ]}
              value={branchId}
              onChange={(value) => {
                setBranchId(value);
                void load(year, month, value);
              }}
            />
          ) : null}
          {isStaff ? (
            <PendingBar
              count={allPending.length}
              onOpen={() => {
                if (allPending.length > 3) setPendingSheetOpen(true);
                else requestAnchor.current?.scrollIntoView({ behavior: "smooth" });
              }}
            />
          ) : null}
        </div>

        <div className="mt-1 px-4">
          {loading ? (
            <CalendarSkeleton />
          ) : (
            <CalendarMonth
              year={year}
              month={month}
              selectedDate={selectedDate}
              days={days}
              assignmentsById={assignmentsById}
              draggableIds={draggableIds}
              onSelect={selectDate}
            />
          )}
        </div>

        <div className="px-4 pt-4">
          <AgendaList
            date={selectedDate}
            assignments={dayAssignments}
            myUserId={myUserId}
            showBranch={isStaff && branchId === "all"}
            hint={agendaHint}
            draggableIds={draggableIds}
            onEdit={isStaff ? (item) => void openEdit(item) : undefined}
            onDelete={isStaff ? (item) => setDeleting(item) : undefined}
            onRequestMine={
              myCanRequest ? () => setRequestFormOpen(true) : undefined
            }
          />
          {isStaff && dayAssignments.length === 0 ? (
            <SecondaryButton
              className="mt-3"
              onClick={() => void openAdd()}
            >
              + 근무 추가
            </SecondaryButton>
          ) : null}

          <div ref={requestAnchor} className="mt-6">
            {isStaff && dayPending.length > 0 ? (
              <div className="flex flex-col gap-3">
                <h3 className="text-17 text-ink">변경 요청</h3>
                {dayPending.map((request) => (
                  <ChangeRequestCard
                    key={request.id}
                    request={request}
                    admin
                    onApprove={(id) => void handleApprove(id)}
                    onReject={(id) => void handleReject(id)}
                  />
                ))}
              </div>
            ) : null}
            {!isStaff && myPending ? (
              <div className="mt-4">
                <ChangeRequestCard
                  request={myPending}
                  onCancel={() => setCanceling(myPending)}
                />
              </div>
            ) : null}
          </div>

          {!loading ? (
            <section
              className={
                isStaff
                  ? "mt-8 pb-[calc(var(--fab-size)+24px)]"
                  : "mt-8"
              }
            >
              <div className="mb-3 flex items-center">
                <h2 className="text-17 text-ink">근무일수</h2>
                <HintTooltip label="근무일수 안내">
                  근무일수 + 근무예정일수
                </HintTooltip>
              </div>
              {isStaff && monthWorkDays.length === 0 ? (
                <EmptyState
                  message={
                    branchId !== "all"
                      ? "해당 지점의 직원이 없습니다."
                      : "근무 중인 직원이 없습니다."
                  }
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {monthWorkDays.map((person) => (
                    <ListRow
                      key={person.id}
                      title={person.name}
                      subtitle={
                        isStaff && branchId === "all"
                          ? (person.branch_name ?? undefined)
                          : undefined
                      }
                      right={
                        <span className="text-17 font-semibold tabular-nums text-ink">
                          {person.days}일
                        </span>
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </div>

        {isStaff ? (
          <div
            className="pointer-events-none fixed left-1/2 z-30 flex w-full max-w-[520px] -translate-x-1/2 justify-end px-4"
            style={{
              bottom: "calc(var(--tabbar-h) + env(safe-area-inset-bottom) + 16px)",
            }}
          >
            <div className="pointer-events-auto">
              <FAB onClick={() => void openAdd()} />
            </div>
          </div>
        ) : null}

        {shiftOpen ? (
          <ShiftSheet
            key={editing?.id ?? "create"}
            open
            date={selectedDate}
            branchName={selectedBranchName}
            branches={initialBranches}
            requireBranch={requireBranch && !editing}
            assignment={editing}
            assignable={assignable}
            onBranchChange={(id) => {
              void listAssignableEmployeesAction(id).then((result) => {
                setAssignable(result.ok ? result.data : []);
              });
            }}
            onClose={() => setShiftOpen(false)}
            onCreate={async (userId, start, end, fromDate, toDate) => {
              const created = await assignEmployeeRangeAction({
                userId,
                startDate: fromDate,
                endDate: toDate,
                startTime: start,
                endTime: end,
              });
              if (!created.ok) return created.error;
              setData((current) => ({
                ...current,
                assignments: [...current.assignments, ...created.data],
              }));
              return null;
            }}
            onUpdate={async (id, start, end, userId) => {
              const result = await updateAssignmentTimeAction({
                id,
                startTime: start,
                endTime: end,
                userId,
              });
              if (!result.ok) return result.error;
              setData((current) => ({
                ...current,
                assignments: current.assignments.map((item) =>
                  item.id === id ? result.data : item,
                ),
              }));
              return null;
            }}
          />
        ) : null}

        <Dialog
          open={Boolean(deleting)}
          title="근무 삭제"
          onClose={() => setDeleting(null)}
        >
          <p className="text-15 text-ink">
            이 날 배정에서 빼면 직원 일정에서 사라집니다.
          </p>
          <div className="mt-6 flex gap-3">
            <GhostButton onClick={() => setDeleting(null)}>취소</GhostButton>
            <DangerButton
              onClick={() => {
                if (!deleting) return;
                const id = deleting.id;
                setDeleting(null);
                void (async () => {
                  const result = await removeAssignmentAction(id);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setData((current) => ({
                    ...current,
                    assignments: current.assignments.filter(
                      (item) => item.id !== id,
                    ),
                  }));
                })();
              }}
            >
              삭제
            </DangerButton>
          </div>
        </Dialog>

        {requestFormOpen && myShift && myCanRequest ? (
          <BottomSheet
            open
            title={`변경 요청 · ${shortDayLabel(selectedDate)}`}
            onClose={() => setRequestFormOpen(false)}
          >
            <ChangeRequestForm
              date={selectedDate}
              currentStart={myShift.start_time}
              currentEnd={myShift.end_time}
              onCancel={() => setRequestFormOpen(false)}
              onSubmitted={() => {
                setRequestFormOpen(false);
                setToast("변경 요청을 보냈습니다.");
                void load(year, month, branchId);
              }}
            />
          </BottomSheet>
        ) : null}

        <PendingListSheet
          open={pendingSheetOpen}
          requests={allPending}
          onClose={() => setPendingSheetOpen(false)}
          onApprove={(id) => void handleApprove(id)}
          onReject={(id) => void handleReject(id)}
        />
        <ConfirmSheet
          open={Boolean(pendingMove)}
          title="근무 변경"
          confirmLabel={moveBusy ? "변경 중" : "변경"}
          body={
            pendingMove
              ? `${displayName(pendingMove.assignment, myUserId)} 근무를 ${shortDayLabel(pendingMove.assignment.work_date)}에서 ${shortDayLabel(pendingMove.toDate)}로 변경할까요?`
              : ""
          }
          onClose={() => {
            if (moveBusy) return;
            setPendingMove(null);
          }}
          onConfirm={() => {
            if (moveBusy) return;
            void confirmMove();
          }}
        />
        <ConfirmSheet
          open={Boolean(canceling)}
          title="요청 취소"
          confirmLabel="요청 취소"
          danger
          body="이 변경 요청을 취소할까요?"
          onClose={() => setCanceling(null)}
          onConfirm={() => {
            if (!canceling) return;
            const id = canceling.id;
            setCanceling(null);
            void handleCancel(id);
          }}
        />
        {toast ? (
          <NoticeToast message={toast} variant="ok" onDone={() => setToast("")} />
        ) : null}
      </div>
      </ShiftDndProvider>
    </ChipTintProvider>
  );

  async function handleApprove(id: string) {
    const result = await approveChangeRequestAction(id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setData((current) => ({
      requests: current.requests.map((item) =>
        item.id === id ? result.data : item,
      ),
      assignments: current.assignments.map((item) =>
        item.user_id === result.data.user_id &&
        item.work_date === result.data.work_date
          ? {
              ...item,
              work_date: result.data.requested_date,
              start_time: result.data.requested_start,
              end_time: result.data.requested_end,
            }
          : item,
      ),
    }));
    setToast("승인했습니다.");
  }

  async function handleCancel(id: string) {
    const result = await cancelChangeRequestAction(id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setData((current) => ({
      ...current,
      requests: current.requests.filter((item) => item.id !== id),
    }));
    setToast("변경 요청을 취소했습니다.");
  }

  async function handleReject(id: string) {
    const result = await rejectChangeRequestAction(id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setData((current) => ({
      ...current,
      requests: current.requests.map((item) =>
        item.id === id ? result.data : item,
      ),
    }));
    setToast("거절했습니다.");
  }
}
