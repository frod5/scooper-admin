import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv, getSupabaseSecretKey } from "@/lib/supabase/env";

export function createAdminClient() {
  const env = getSupabasePublicEnv();
  const secretKey = getSupabaseSecretKey();
  if (!env || !secretKey) {
    throw new Error("SUPABASE_SECRET_KEY 또는 NEXT_PUBLIC_SUPABASE_URL이 없습니다.");
  }

  return createClient(env.url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
