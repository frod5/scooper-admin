"use client";

import { useCallback, useMemo, useState } from "react";
import { EmployeeDetailSheet } from "@/components/employees/EmployeeDetailSheet";
import { IssueEmployeeSheet } from "@/components/employees/IssueEmployeeSheet";
import { IssueOwnerSheet } from "@/components/employees/IssueOwnerSheet";
import { useAdminRole } from "@/components/shell/AdminShell";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { FAB } from "@/components/ui/FAB";
import { FilterChips } from "@/components/ui/FilterChips";
import { GhostButton } from "@/components/ui/GhostButton";
import { ListRow } from "@/components/ui/ListRow";
import { NoticeToast } from "@/components/ui/NoticeToast";
import { SearchField } from "@/components/ui/SearchField";
import { listDirectoryAction } from "@/lib/employees/actions";
import { formatPhone } from "@/lib/phone";
import type { Branch, DirectoryPerson } from "@/lib/types";

function RowSkeleton() {
  return (
    <div className="flex min-h-14 items-center gap-3 rounded-16 bg-surface px-4 py-3 shadow-card">
      <div className="flex-1">
        <div className="h-4 w-24 rounded-8 bg-surface-2" />
        <div className="mt-2 h-3 w-40 rounded-8 bg-surface-2" />
      </div>
      <div className="h-5 w-12 rounded-8 bg-surface-2" />
    </div>
  );
}

export function EmployeesPage({
  initialPeople,
  initialBranches,
  loadError,
}: {
  initialPeople: DirectoryPerson[];
  initialBranches: Branch[];
  loadError?: string;
}) {
  const role = useAdminRole();
  const isSystemAdmin = role === "system_admin";

  const [people, setPeople] = useState(initialPeople);
  const [branches] = useState(initialBranches);
  const [error, setError] = useState(loadError ?? "");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [issueEmployeeOpen, setIssueEmployeeOpen] = useState(false);
  const [issueOwnerOpen, setIssueOwnerOpen] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [detail, setDetail] = useState<DirectoryPerson | null>(null);
  const [toast, setToast] = useState("");

  const openAdd = useCallback(() => {
    if (isSystemAdmin) setChooserOpen(true);
    else setIssueEmployeeOpen(true);
  }, [isSystemAdmin]);

  const branchChips = useMemo(
    () => [
      { value: "all", label: "전체" },
      ...branches.map((branch) => ({ value: branch.id, label: branch.name })),
    ],
    [branches],
  );

  const employees = people.filter(
    (person) => person.role === "employee" && person.status === "active",
  );
  const owners = people.filter(
    (person) => person.role === "owner" && person.status === "active",
  );

  const visibleEmployees = employees.filter((person) => {
    if (branchFilter !== "all" && person.branch_id !== branchFilter) {
      return false;
    }
    const haystack =
      `${person.name}${person.phone}${formatPhone(person.phone)}`.toLowerCase();
    const q = query.trim().toLowerCase();
    if (q && !haystack.includes(q)) return false;
    return true;
  });

  const visibleOwners = isSystemAdmin ? owners : [];

  const searching = Boolean(query.trim());
  const emptyEmployees = visibleEmployees.length === 0;

  async function retry() {
    setLoading(true);
    const result = await listDirectoryAction();
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setPeople(result.data);
  }

  function upsert(person: DirectoryPerson) {
    setPeople((current) => {
      const without = current.filter((item) => item.id !== person.id);
      if (person.status !== "active") return without;
      if (!isSystemAdmin && person.role !== "employee") return without;
      return [person, ...without];
    });
  }

  return (
    <div>
      {error ? (
        <div className="mb-4">
          <ErrorBanner message={error} onRetry={() => void retry()} />
        </div>
      ) : null}

      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="직원 이름 또는 전화번호"
      />

      {loading ? (
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <RowSkeleton key={index} />
          ))}
        </div>
      ) : null}

      <section className="mt-4">
        <h2 className="mb-2 text-17 text-ink">직원</h2>
        {branches.length > 0 ? (
          <div className="mb-3">
            <FilterChips
              options={branchChips}
              value={branchFilter}
              onChange={setBranchFilter}
            />
          </div>
        ) : null}
        {!loading && !error && emptyEmployees ? (
          <EmptyState
            message={
              searching || branchFilter !== "all"
                ? "검색 결과가 없습니다."
                : "근무 중인 직원이 없습니다."
            }
          />
        ) : null}
        {!loading ? (
          <div className="flex flex-col gap-3">
            {visibleEmployees.map((person) => (
              <ListRow
                key={person.id}
                title={person.name}
                subtitle={[formatPhone(person.phone), person.branch_name]
                  .filter(Boolean)
                  .join(" · ")}
                onClick={() => setDetail(person)}
              />
            ))}
          </div>
        ) : null}
      </section>

      {isSystemAdmin ? (
        <section className="mt-8">
          <h2 className="mb-2 text-17 text-ink">대표</h2>
          {!loading && visibleOwners.length === 0 ? (
            <p className="py-6 text-center text-15 text-muted">
              대표가 없습니다.
            </p>
          ) : null}
          {!loading ? (
            <div className="flex flex-col gap-3">
              {visibleOwners.map((person) => (
                <ListRow
                  key={person.id}
                  title={person.name}
                  subtitle={`${formatPhone(person.phone)} · 대표`}
                  onClick={() => setDetail(person)}
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <div
        className="pointer-events-none fixed left-1/2 z-30 flex w-full max-w-[520px] -translate-x-1/2 justify-end px-4"
        style={{
          bottom: "calc(var(--tabbar-h) + env(safe-area-inset-bottom) + 16px)",
        }}
      >
        <div className="pointer-events-auto">
          <FAB
            label={isSystemAdmin ? "추가" : "직원 추가"}
            onClick={openAdd}
          />
        </div>
      </div>

      <Dialog
        open={chooserOpen}
        title="추가"
        onClose={() => setChooserOpen(false)}
      >
        <div className="flex flex-col gap-3">
          <ListRow
            title="직원 추가"
            onClick={() => {
              setChooserOpen(false);
              setIssueEmployeeOpen(true);
            }}
          />
          <ListRow
            title="대표 추가"
            onClick={() => {
              setChooserOpen(false);
              setIssueOwnerOpen(true);
            }}
          />
        </div>
        <GhostButton className="mt-4" onClick={() => setChooserOpen(false)}>
          취소
        </GhostButton>
      </Dialog>

      {issueEmployeeOpen ? (
        <IssueEmployeeSheet
          open
          branches={branches}
          onClose={() => setIssueEmployeeOpen(false)}
          onIssued={(person) => {
            upsert(person);
            setIssueEmployeeOpen(false);
            setToast("직원을 추가했습니다. 초기 비밀번호 123456.");
          }}
        />
      ) : null}
      {issueOwnerOpen ? (
        <IssueOwnerSheet
          open
          onClose={() => setIssueOwnerOpen(false)}
          onIssued={(person) => {
            upsert(person);
            setIssueOwnerOpen(false);
            setToast("대표를 추가했습니다. 초기 비밀번호 123456.");
          }}
        />
      ) : null}
      {detail ? (
        <EmployeeDetailSheet
          key={detail.id}
          open
          person={detail}
          branches={branches}
          canResetPassword={isSystemAdmin}
          onClose={() => setDetail(null)}
          onSaved={(person, toast) => {
            upsert(person);
            setDetail(person);
            setToast(toast ?? "저장했습니다.");
          }}
        />
      ) : null}
      {toast ? (
        <NoticeToast message={toast} variant="ok" onDone={() => setToast("")} />
      ) : null}
    </div>
  );
}
