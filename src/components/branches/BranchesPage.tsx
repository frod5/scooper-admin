"use client";

import { useCallback, useState } from "react";
import { BranchEditSheet } from "@/components/branches/BranchEditSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { FAB } from "@/components/ui/FAB";
import { ListRow } from "@/components/ui/ListRow";
import { NoticeToast } from "@/components/ui/NoticeToast";
import { listBranchesAction } from "@/lib/branches/actions";
import { NETWORK_ERROR } from "@/lib/errors";
import type { Branch } from "@/lib/types";

function RowSkeleton() {
  return (
    <div className="flex min-h-14 items-center rounded-16 bg-surface px-4 py-3 shadow-card">
      <div className="h-4 w-28 rounded-8 bg-surface-2" />
      <div className="ml-auto h-3 w-8 rounded-8 bg-surface-2" />
    </div>
  );
}

export function BranchesPage({
  initialBranches,
  loadError,
}: {
  initialBranches: Branch[];
  loadError?: string;
}) {
  const [branches, setBranches] = useState(initialBranches);
  const [error, setError] = useState(loadError ?? "");
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [toast, setToast] = useState("");

  const openCreate = useCallback(() => {
    setEditing(null);
    setSheetOpen(true);
  }, []);

  async function retry() {
    setLoading(true);
    const result = await listBranchesAction();
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setBranches(result.data);
  }

  return (
    <div>
      {error ? (
        <div className="mb-4">
          <ErrorBanner
            message={error || NETWORK_ERROR}
            onRetry={() => void retry()}
          />
        </div>
      ) : null}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <RowSkeleton key={index} />
          ))}
        </div>
      ) : null}

      {!loading && !error && branches.length === 0 ? (
        <EmptyState message="지점이 없습니다." />
      ) : null}

      {!loading && branches.length > 0 ? (
        <div className="flex flex-col gap-3">
          {branches.map((branch) => (
            <ListRow
              key={branch.id}
              title={branch.name}
              right={
                <span className="text-13 text-muted">
                  {branch.activeEmployeeCount}명
                </span>
              }
              onClick={() => {
                setEditing(branch);
                setSheetOpen(true);
              }}
            />
          ))}
        </div>
      ) : null}

      <div
        className="pointer-events-none fixed left-1/2 z-30 flex w-full max-w-[520px] -translate-x-1/2 justify-end px-4"
        style={{
          bottom: "calc(var(--tabbar-h) + env(safe-area-inset-bottom) + 16px)",
        }}
      >
        <div className="pointer-events-auto">
          <FAB label="지점 추가" onClick={openCreate} />
        </div>
      </div>

      {sheetOpen ? (
        <BranchEditSheet
          open
          branch={editing}
          onClose={() => setSheetOpen(false)}
          onSaved={(saved) => {
            setBranches((current) => {
              const exists = current.some((item) => item.id === saved.id);
              if (exists) {
                return current
                  .map((item) =>
                    item.id === saved.id
                      ? { ...item, name: saved.name }
                      : item,
                  )
                  .sort((a, b) => a.name.localeCompare(b.name, "ko"));
              }
              return [saved, ...current];
            });
            setSheetOpen(false);
            setToast(editing ? "저장했습니다." : "지점을 추가했습니다.");
          }}
          onDeleted={(id) => {
            setBranches((current) => current.filter((item) => item.id !== id));
            setSheetOpen(false);
            setToast("지점을 삭제했습니다.");
          }}
        />
      ) : null}

      {toast ? (
        <NoticeToast message={toast} variant="ok" onDone={() => setToast("")} />
      ) : null}
    </div>
  );
}
