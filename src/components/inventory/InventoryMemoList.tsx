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
}: {
  memos: InventoryMemo[];
  showBranch?: boolean;
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
                <p className="text-15 font-semibold text-ink">
                  {memo.author_name}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-15 text-ink">
                  {memo.body}
                </p>
              </article>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
