"use client";

import { useMemo, useState } from "react";
import { ChangeRequestCard } from "@/components/calendar/ChangeRequestCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { FilterChips } from "@/components/ui/FilterChips";
import { NoticeToast } from "@/components/ui/NoticeToast";
import { dayTitle } from "@/lib/datetime";
import {
  approveChangeRequestAction,
  listPendingChangeRequestsAction,
  rejectChangeRequestAction,
} from "@/lib/schedules/actions";
import type { Branch, ChangeRequest } from "@/lib/types";

export function AdminRequestsPage({
  initialRequests,
  initialBranches,
  loadError,
}: {
  initialRequests: ChangeRequest[];
  initialBranches: Branch[];
  loadError?: string;
}) {
  const [requests, setRequests] = useState(
    initialRequests.filter((item) => item.status === "pending"),
  );
  const [error, setError] = useState(loadError ?? "");
  const [loading, setLoading] = useState(false);
  const [branchId, setBranchId] = useState("all");
  const [toast, setToast] = useState("");

  const branchChips = useMemo(
    () => [
      { value: "all", label: "전체" },
      ...initialBranches.map((branch) => ({
        value: branch.id,
        label: branch.name,
      })),
    ],
    [initialBranches],
  );

  const visible = requests.filter(
    (item) => branchId === "all" || item.branch_id === branchId,
  );

  const groups = useMemo(() => {
    const map = new Map<string, ChangeRequest[]>();
    for (const item of visible) {
      const list = map.get(item.work_date) ?? [];
      list.push(item);
      map.set(item.work_date, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [visible]);

  async function retry() {
    setLoading(true);
    const result = await listPendingChangeRequestsAction();
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setRequests(result.data.filter((item) => item.status === "pending"));
  }

  async function handleApprove(id: string) {
    const result = await approveChangeRequestAction(id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setRequests((current) => current.filter((item) => item.id !== id));
    setToast("승인했습니다. 근무가 변경되었습니다.");
  }

  async function handleReject(id: string) {
    const result = await rejectChangeRequestAction(id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setRequests((current) => current.filter((item) => item.id !== id));
    setToast("거절했습니다.");
  }

  return (
    <div>
      {error ? (
        <div className="mb-4">
          <ErrorBanner message={error} onRetry={() => void retry()} />
        </div>
      ) : null}

      {initialBranches.length > 0 ? (
        <div className="mb-4">
          <FilterChips
            options={branchChips}
            value={branchId}
            onChange={setBranchId}
          />
        </div>
      ) : null}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 rounded-16 bg-surface shadow-card"
            />
          ))}
        </div>
      ) : null}

      {!loading && visible.length === 0 ? (
        <EmptyState
          message={
            branchId !== "all"
              ? "해당 지점의 변경 요청이 없습니다."
              : "대기 중인 변경 요청이 없습니다."
          }
        />
      ) : null}

      {!loading
        ? groups.map(([date, items]) => (
            <section key={date} className="mb-6 flex flex-col gap-3">
              <h2 className="text-13 font-semibold text-muted">
                {dayTitle(date)}
              </h2>
              {items.map((request) => (
                <ChangeRequestCard
                  key={request.id}
                  request={request}
                  admin
                  onApprove={(id) => void handleApprove(id)}
                  onReject={(id) => void handleReject(id)}
                />
              ))}
            </section>
          ))
        : null}

      {toast ? (
        <NoticeToast message={toast} variant="ok" onDone={() => setToast("")} />
      ) : null}
    </div>
  );
}
