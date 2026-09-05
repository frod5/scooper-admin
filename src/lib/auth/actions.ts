"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { isValidPhone, normalizePhone, phoneToEmail } from "@/lib/phone";
import { homePath } from "@/lib/roles";
import type { UserRole, UserStatus } from "@/lib/types";

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function loginAction(
  phone: string,
  password: string,
): Promise<LoginResult> {
  if (!getSupabasePublicEnv()) {
    return { ok: false, error: "연결에 실패했습니다. 다시 시도하세요." };
  }

  const digits = normalizePhone(phone);
  if (!isValidPhone(digits)) {
    return { ok: false, error: "전화번호를 확인하세요" };
  }
  if (!password) {
    return { ok: false, error: "비밀번호를 입력하세요" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: phoneToEmail(digits),
    password,
  });

  if (error || !data.user) {
    return {
      ok: false,
      error: "전화번호 또는 비밀번호가 올바르지 않습니다.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "전화번호 또는 비밀번호가 올바르지 않습니다.",
    };
  }

  const status = profile.status as UserStatus;
  if (status === "resigned") {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "퇴사한 계정입니다. 관리자에게 문의하세요.",
    };
  }

  redirect(homePath(profile.role as UserRole));
}

export async function logoutAction() {
  if (getSupabasePublicEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
