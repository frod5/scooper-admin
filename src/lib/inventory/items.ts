import type { InventoryItem, InventoryMemo } from "@/lib/types";

export function parseInventoryItems(body: string): InventoryItem[] {
  try {
    const parsed = JSON.parse(body) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const record = row as { label?: unknown; qty?: unknown };
        const label = String(record.label ?? "").trim();
        const qty = Number(record.qty);
        if (!label || !Number.isFinite(qty) || qty < 0) return null;
        return { label, qty };
      })
      .filter((item): item is InventoryItem => item !== null);
  } catch {
    const text = body.trim();
    return text ? [{ label: text, qty: 1 }] : [];
  }
}

export function serializeInventoryItems(items: InventoryItem[]): string {
  return JSON.stringify(
    items.map((item) => ({
      label: item.label.trim(),
      qty: item.qty,
    })),
  );
}

export function previousInventoryItems(
  memos: InventoryMemo[],
  beforeDate: string,
  branchId?: string | null,
): InventoryItem[] | null {
  let prevDate = "";
  for (const memo of memos) {
    if (branchId && memo.branch_id !== branchId) continue;
    if (memo.memo_date >= beforeDate) continue;
    if (memo.memo_date > prevDate) prevDate = memo.memo_date;
  }
  if (!prevDate) return null;
  const items: InventoryItem[] = [];
  const seen = new Set<string>();
  for (const memo of memos) {
    if (memo.memo_date !== prevDate) continue;
    if (branchId && memo.branch_id !== branchId) continue;
    for (const item of memo.items) {
      if (seen.has(item.label)) continue;
      seen.add(item.label);
      items.push(item);
    }
  }
  return items;
}
