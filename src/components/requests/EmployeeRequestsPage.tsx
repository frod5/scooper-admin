"use client";

import { useMemo, useState } from "react";
import { ChangeRequestForm } from "@/components/schedule/ChangeRequestForm";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { GhostButton } from "@/components/ui/GhostButton";
import { NoticeToast } from "@/components/ui/NoticeToast";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  WEEKDAY_LABELS,
  canRequestChange,
  formatTimeRange,
  shiftMonth,
  shortDayLabel,
  todayISO,
  toISODate,
  weekdayIndex,
  yearMonthNow,
} from "@/lib/datetime";
import {
  cancelChangeRequestAction,
  listEmployeeMonthAction,
} from "@/lib/schedules/actions";
import { myPendingOnDate } from "@/lib/schedules/view";
import type {
  ChangeRequest,
  InventoryMemo,
  MonthScheduleData,
  WorkAssignment,
} from "@/lib/types";

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

function requestDayLabel(iso: string) {
  const [, month, day] = iso.split("-").map(Number);
  return `${month}월 ${day}일 ${WEEKDAY_LABELS[weekdayIndex(iso)]}`;
}

function weekStart(iso: string) {
  const index = weekdayIndex(iso);
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day - index);
  return toISODate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function weekLabel(start: string, today: string) {
  const thisWeek = weekStart(today);
  if (start === thisWeek) return "이번 주";
  const [year, month, day] = thisWeek.split("-").map(Number);
  const next = new Date(year, month - 1, day + 7);
  const nextWeek = toISODate(
    next.getFullYear(),
    next.getMonth() + 1,
    next.getDate(),
  );
  if (start === nextWeek) return "다음 주";
  const [, weekMonth, weekDay] = start.split("-").map(Number);
  return `${weekMonth}월 ${weekDay}일 주`;
}

async function loadNearbyMonths() {
  const now = yearMonthNow();
  const prev = shiftMonth(now.year, now.month, -1);
  const next = shiftMonth(now.year, now.month, 1);
  const results = await Promise.all([
    listEmployeeMonthAction(prev.year, prev.month),
    listEmployeeMonthAction(now.year, now.month),
    listEmployeeMonthAction(next.year, next.month),
  ]);
  const failed = results.find((result) => !result.ok);
  return {
    data: mergeMonths(
      results
        .filter(
          (result): result is { ok: true; data: MonthScheduleData } =>
            result.ok,
        )
        .map((result) => result.data),
    ),
    error: failed ? "일정을 불러오지 못했습니다." : "",
  };
}

export function EmployeeRequestsPage({
  userId,
  initialData,
  loadError,
}: {
  userId: string;
  initialData: MonthScheduleData;
  loadError?: string;
}) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(loadError ?? "");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState<WorkAssignment | null>(null);
  const [canceling, setCanceling] = useState<ChangeRequest | null>(null);

  const mine = useMemo(
    () =>
      data.assignments
        .filter(
          (item) => item.user_id === userId && item.status === "active",
        )
        .sort((a, b) => {
          const date = a.work_date.localeCompare(b.work_date);
          if (date !== 0) return date;
          return a.start_time.localeCompare(b.start_time);
        }),
    [data.assignments, userId],
  );

  const upcoming = mine.filter((item) =>
    canRequestChange(item.work_date, item.start_time),
  );

  const grouped = useMemo(() => {
    const today = todayISO();
    const groups: { label: string; items: WorkAssignment[] }[] = [];
    for (const item of upcoming) {
      const label = weekLabel(weekStart(item.work_date), today);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(item);
      else groups.push({ label, items: [item] });
    }
    return groups;
  }, [upcoming]);

  async function reload() {
    setLoading(true);
    const result = await loadNearbyMonths();
    setLoading(false);
    setData(result.data);
    setError(result.error);
  }

  function openForm(item: WorkAssignment) {
    const pending = myPendingOnDate(data.requests, item.work_date, userId);
    if (pending) return;
    if (!canRequestChange(item.work_date, item.start_time)) return;
    setEditing(item);
  }

  async function handleCancel(id: string) {
    const result = await cancelChangeRequestAction(id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setData((current) => ({
      ...current,
      requests: current.requests.filter((item) => item.id !== id),
    }));
    setToast("변경 요청을 취소했습니다.");
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <ErrorBanner
          message={error}
          onRetry={() => void reload()}
        />
      ) : null}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-20 rounded-16 bg-surface shadow-card"
            />
          ))}
        </div>
      ) : null}

      {!loading && upcoming.length === 0 ? (
        <EmptyState message="변경할 수 있는 근무가 없습니다." />
      ) : null}

      {!loading
        ? grouped.map((group) => (
            <section key={group.label} className="flex flex-col gap-3">
              <h2 className="text-13 font-semibold text-muted">{group.label}</h2>
              {group.items.map((item) => {
                const pending = myPendingOnDate(
                  data.requests,
                  item.work_date,
                  userId,
                );
                return (
                  <RequestShiftCard
                    key={item.id}
                    assignment={item}
                    pending={pending}
                    onRequest={() => openForm(item)}
                    onCancelPending={
                      pending ? () => setCanceling(pending) : undefined
                    }
                  />
                );
              })}
            </section>
          ))
        : null}

      {editing ? (
        <BottomSheet
          open
          title={`변경 요청 · ${requestDayLabel(editing.work_date)}`}
          onClose={() => setEditing(null)}
        >
          <ChangeRequestForm
            date={editing.work_date}
            currentStart={editing.start_time}
            currentEnd={editing.end_time}
            onCancel={() => setEditing(null)}
            onSubmitted={() => {
              setEditing(null);
              setToast("변경 요청을 보냈습니다.");
              void reload();
            }}
          />
        </BottomSheet>
      ) : null}

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
  );
}

function RequestShiftCard({
  assignment,
  pending,
  onRequest,
  onCancelPending,
}: {
  assignment: WorkAssignment;
  pending?: ChangeRequest;
  onRequest?: () => void;
  onCancelPending?: () => void;
}) {
  const canOpen = Boolean(onRequest) && !pending;

  return (
    <div className="rounded-16 bg-surface px-4 py-3 shadow-card">
      <button
        type="button"
        disabled={!canOpen}
        onClick={canOpen ? onRequest : undefined}
        className="flex w-full flex-col text-left disabled:cursor-default"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-17 text-ink">{requestDayLabel(assignment.work_date)}</p>
          {pending ? <StatusBadge variant="pending" /> : null}
        </div>
        <p className="mt-1 text-13 text-muted">
          {pending
            ? pending.requested_date !== assignment.work_date
              ? `${shortDayLabel(assignment.work_date)} ${formatTimeRange(assignment.start_time, assignment.end_time)} → ${shortDayLabel(pending.requested_date)} ${formatTimeRange(pending.requested_start, pending.requested_end)}`
              : `${formatTimeRange(assignment.start_time, assignment.end_time)} → ${formatTimeRange(pending.requested_start, pending.requested_end)}`
            : formatTimeRange(assignment.start_time, assignment.end_time)}
        </p>
        {pending?.reason ? (
          <p className="mt-1 text-13 text-muted">{pending.reason}</p>
        ) : null}
      </button>
      {canOpen ? (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={onRequest}
            className="h-9 rounded-pill bg-accent px-4 text-13 font-semibold text-surface active:bg-accent-press"
          >
            변경 요청
          </button>
        </div>
      ) : null}
      {pending && onCancelPending ? (
        <div className="mt-2 flex justify-end">
          <GhostButton className="h-9 text-15" onClick={onCancelPending}>
            요청 취소
          </GhostButton>
        </div>
      ) : null}
    </div>
  );
}
