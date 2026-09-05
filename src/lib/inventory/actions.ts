"use server";

import { revalidatePath } from "next/cache";
import { requireEmployee, requireProfile } from "@/lib/auth/session";
import { NETWORK_ERROR } from "@/lib/errors";
import {
  parseInventoryItems,
  serializeInventoryItems,
} from "@/lib/inventory/items";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { ActionResult, InventoryItem, InventoryMemo } from "@/lib/types";

function asDate(value: string) {
  return String(value).slice(0, 10);
}

function isISODate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function cleanItems(items: InventoryItem[]): InventoryItem[] | string {
  const cleaned: InventoryItem[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const label = item.label.trim();
    if (!label) continue;
    if (seen.has(label)) continue;
    if (!Number.isFinite(item.qty) || item.qty < 0) {
      return "수량을 확인하세요.";
    }
    seen.add(label);
    cleaned.push({ label, qty: item.qty });
  }
  if (cleaned.length === 0) return "항목을 추가하세요.";
  return cleaned;
}

function mapMemo(
  row: {
    id: string;
    user_id: string;
    branch_id: string;
    memo_date: string;
    body: string;
    created_at: string;
  },
  authorName: string,
  branchName: string | null,
): InventoryMemo {
  return {
    id: row.id,
    user_id: row.user_id,
    author_name: authorName,
    branch_id: row.branch_id,
    branch_name: branchName,
    memo_date: asDate(row.memo_date),
    body: row.body,
    items: parseInventoryItems(row.body),
    created_at: row.created_at,
  };
}

function revalidateMemos() {
  revalidatePath("/app");
  revalidatePath("/admin");
}

export async function listPreviousInventoryItemsAction(
  memoDate: string,
): Promise<ActionResult<InventoryItem[]>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  const profile = await requireEmployee();
  if (!profile.branch_id) return { ok: true, data: [] };
  const date = asDate(memoDate);
  if (!isISODate(date)) return { ok: true, data: [] };

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("inventory_memos")
    .select("memo_date, body")
    .eq("branch_id", profile.branch_id)
    .lt("memo_date", date)
    .order("memo_date", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(40);
  if (error) return { ok: false, error: NETWORK_ERROR };
  if (!rows?.length) return { ok: true, data: [] };

  const prevDate = asDate(rows[0].memo_date as string);
  const items: InventoryItem[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (asDate(row.memo_date as string) !== prevDate) continue;
    for (const item of parseInventoryItems(row.body as string)) {
      if (seen.has(item.label)) continue;
      seen.add(item.label);
      items.push(item);
    }
  }
  return { ok: true, data: items };
}

export async function createInventoryMemoAction(input: {
  memoDate: string;
  items: InventoryItem[];
}): Promise<ActionResult<InventoryMemo>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  const profile = await requireEmployee();
  if (!profile.branch_id) {
    return { ok: false, error: "소속 지점이 없습니다." };
  }
  const memoDate = asDate(input.memoDate);
  if (!isISODate(memoDate)) {
    return { ok: false, error: "날짜를 확인하세요." };
  }
  const items = cleanItems(input.items);
  if (typeof items === "string") return { ok: false, error: items };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_memos")
    .insert({
      user_id: profile.id,
      branch_id: profile.branch_id,
      memo_date: memoDate,
      body: serializeInventoryItems(items),
    })
    .select("id, user_id, branch_id, memo_date, body, created_at")
    .single();
  if (error || !data) return { ok: false, error: NETWORK_ERROR };

  revalidateMemos();
  return {
    ok: true,
    data: mapMemo(
      {
        id: data.id as string,
        user_id: data.user_id as string,
        branch_id: data.branch_id as string,
        memo_date: data.memo_date as string,
        body: data.body as string,
        created_at: data.created_at as string,
      },
      profile.name,
      profile.branch_name,
    ),
  };
}

export async function updateInventoryMemoAction(input: {
  id: string;
  memoDate: string;
  items: InventoryItem[];
}): Promise<ActionResult<InventoryMemo>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  const profile = await requireProfile();
  const memoDate = asDate(input.memoDate);
  if (!isISODate(memoDate)) {
    return { ok: false, error: "날짜를 확인하세요." };
  }
  const items = cleanItems(input.items);
  if (typeof items === "string") return { ok: false, error: items };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_memos")
    .update({
      memo_date: memoDate,
      body: serializeInventoryItems(items),
    })
    .eq("id", input.id)
    .select("id, user_id, branch_id, memo_date, body, created_at")
    .single();
  if (error || !data) return { ok: false, error: NETWORK_ERROR };

  revalidateMemos();
  return {
    ok: true,
    data: mapMemo(
      {
        id: data.id as string,
        user_id: data.user_id as string,
        branch_id: data.branch_id as string,
        memo_date: data.memo_date as string,
        body: data.body as string,
        created_at: data.created_at as string,
      },
      profile.id === (data.user_id as string) ? profile.name : "",
      profile.branch_name,
    ),
  };
}

export async function deleteInventoryMemoAction(
  id: string,
): Promise<ActionResult<null>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("inventory_memos").delete().eq("id", id);
  if (error) return { ok: false, error: NETWORK_ERROR };
  revalidateMemos();
  return { ok: true, data: null };
}
