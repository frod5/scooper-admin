"use server";

import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/session";
import { NETWORK_ERROR } from "@/lib/errors";
import { notifyStaffOfOwnerRequest } from "@/lib/push/send";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { ActionResult } from "@/lib/types";

export async function createOwnerRequestAction(input: {
  body: string;
}): Promise<ActionResult<null> & { pushFailed?: boolean }> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  const profile = await requireEmployee();
  const body = input.body.trim();
  if (!body) return { ok: false, error: "요청 내용을 입력하세요." };

  const supabase = await createClient();
  const { error } = await supabase.from("owner_requests").insert({
    user_id: profile.id,
    body,
  });
  if (error) return { ok: false, error: NETWORK_ERROR };

  revalidatePath("/admin");
  revalidatePath("/admin/notifications");

  try {
    const push = await notifyStaffOfOwnerRequest({
      employeeName: profile.name,
      body,
    });
    return { ok: true, data: null, pushFailed: push.failed };
  } catch {
    return { ok: true, data: null, pushFailed: true };
  }
}
