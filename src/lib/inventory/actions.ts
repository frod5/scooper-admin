"use server";

import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/session";
import { NETWORK_ERROR } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { ActionResult, InventoryMemo } from "@/lib/types";

function asDate(value: string) {
  return String(value).slice(0, 10);
}

function isISODate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function createInventoryMemoAction(input: {
  memoDate: string;
  body: string;
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
  const body = input.body.trim();
  if (!body) {
    return { ok: false, error: "재고 메모를 입력하세요." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_memos")
    .insert({
      user_id: profile.id,
      branch_id: profile.branch_id,
      memo_date: memoDate,
      body,
    })
    .select("id, user_id, branch_id, memo_date, body, created_at")
    .single();
  if (error || !data) return { ok: false, error: NETWORK_ERROR };

  revalidatePath("/app");
  revalidatePath("/admin");

  return {
    ok: true,
    data: {
      id: data.id as string,
      user_id: data.user_id as string,
      author_name: profile.name,
      branch_id: data.branch_id as string,
      branch_name: profile.branch_name,
      memo_date: asDate(data.memo_date as string),
      body: data.body as string,
      created_at: data.created_at as string,
    },
  };
}
