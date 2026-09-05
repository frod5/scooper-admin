"use server";

import { requireProfile } from "@/lib/auth/session";
import { NETWORK_ERROR } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { ActionResult } from "@/lib/types";

export async function savePushSubscriptionAction(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<ActionResult<null>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  const profile = await requireProfile();
  if (!input.endpoint || !input.p256dh || !input.auth) {
    return { ok: false, error: NETWORK_ERROR };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: profile.id,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
    },
    { onConflict: "endpoint" },
  );
  if (error) return { ok: false, error: NETWORK_ERROR };
  return { ok: true, data: null };
}

export async function deletePushSubscriptionAction(
  endpoint: string,
): Promise<ActionResult<null>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) return { ok: false, error: NETWORK_ERROR };
  return { ok: true, data: null };
}
