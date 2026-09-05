import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export function createClient() {
  const env = getSupabasePublicEnv();
  if (!env) {
    throw new Error("Supabase 환경 변수가 없습니다. .env.local을 확인하세요.");
  }
  return createBrowserClient(env.url, env.publishableKey);
}
