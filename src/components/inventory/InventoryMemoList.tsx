"use client";

import type { InventoryMemo } from "@/lib/types";

function groupByBranch(memos: InventoryMemo[]) {
  const groups = new Map<string, { name: string; items: InventoryMemo[] }>();
  for (const memo of memos) {
    const key = memo.branch_id;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(memo);
      continue;
    }
    groups.set(key, {
      name: memo.branch_name || "지점",
      items: [memo],
    });
  }
  return [...groups.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "ko"),
  );
}

export function InventoryMemoList({
  memos,
  showBranch,
  onEdit,
}: {
  memos: InventoryMemo[];
  showBranch?: boolean;
  onEdit?: (memo: InventoryMemo) => void;
}) {
  if (memos.length === 0) return null;
  const groups = groupByBranch(memos);

  return (
    <section className="mt-6">
      <h3 className="text-17 text-ink">재고 메모</h3>
      <div className="mt-3 flex flex-col gap-3">
        {groups.map((group) => (
          <div key={group.name} className="flex flex-col gap-3">
            {showBranch ? (
              <p className="text-13 font-semibold text-muted">{group.name}</p>
            ) : null}
            {group.items.map((memo) => (
              <article
                key={memo.id}
                className="rounded-16 bg-surface p-4 shadow-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-13 text-muted">
                    {memo.author_name}
                  </p>
                  {onEdit ? (
                    <button
                      type="button"
                      className="h-8 shrink-0 text-13 font-semibold text-accent"
                      onClick={() => onEdit(memo)}
                    >
                      수정
                    </button>
                  ) : null}
                </div>
                <ul className="mt-2 flex flex-col">
                  {(memo.items ?? []).map((item) => (
                    <li
                      key={item.label}
                      className="flex items-baseline justify-between gap-3 py-1 text-15 text-ink"
                    >
                      <span className="min-w-0 truncate font-semibold">
                        {item.label}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted">
                        {item.qty}개
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
