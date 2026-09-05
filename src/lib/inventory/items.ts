import type { InventoryItem } from "@/lib/types";

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

export function inventoryItemLine(item: InventoryItem): string {
  return `${item.label} ${item.qty}개`;
}
