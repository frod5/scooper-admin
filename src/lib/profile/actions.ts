"use server";

import { revalidatePath } from "next/cache";
import { updateAuthLoginPhone } from "@/lib/auth/create-account";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/constants";
import { requireProfile } from "@/lib/auth/session";
import { NETWORK_ERROR, isDuplicateError } from "@/lib/errors";
import { isValidPhone, normalizePhone, phoneToEmail } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { ActionResult, Profile } from "@/lib/types";

export async function updateMyProfileAction(input: {
  name: string;
  phone: string;
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResult<Profile>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  const profile = await requireProfile();

  const name = input.name.trim();
  const phone = normalizePhone(input.phone);
  const currentPassword = input.currentPassword;
  const newPassword = input.newPassword;

  if (!name) return { ok: false, error: "이름을 입력하세요." };
  if (!isValidPhone(phone)) return { ok: false, error: "전화번호를 확인하세요" };

  const passwordTouched = Boolean(currentPassword || newPassword);
  if (passwordTouched && (!currentPassword || !newPassword)) {
    return {
      ok: false,
      error: "현재 비밀번호와 새 비밀번호를 모두 입력하세요.",
    };
  }
  if (passwordTouched && newPassword.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: "비밀번호는 최소 6자리입니다." };
  }

  const supabase = await createClient();

  if (phone !== profile.phone) {
    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone", phone)
      .neq("id", profile.id)
      .maybeSingle();
    if (taken) {
      return { ok: false, error: "이미 사용 중인 전화번호입니다." };
    }
  }

  if (passwordTouched) {
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(profile.phone),
      password: currentPassword,
    });
    if (verifyError) {
      return { ok: false, error: "현재 비밀번호가 올바르지 않습니다." };
    }
    const { error: passwordError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (passwordError) return { ok: false, error: NETWORK_ERROR };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ name, phone })
    .eq("id", profile.id)
    .select("id, phone, name, role, status, branch_id")
    .single();

  if (error) {
    if (isDuplicateError(error)) {
      return { ok: false, error: "이미 사용 중인 전화번호입니다." };
    }
    return { ok: false, error: NETWORK_ERROR };
  }

  if (phone !== profile.phone) {
    try {
      await updateAuthLoginPhone(profile.id, phone);
    } catch {
      await supabase
        .from("profiles")
        .update({ phone: profile.phone })
        .eq("id", profile.id);
      return { ok: false, error: NETWORK_ERROR };
    }
  }

  revalidatePath("/app/settings");
  revalidatePath("/app/settings/profile");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/profile");
  return {
    ok: true,
    data: {
      id: data.id as string,
      phone: data.phone as string,
      name: data.name as string,
      role: data.role,
      status: data.status,
      branch_id: data.branch_id,
      branch_name: profile.branch_name,
    },
  };
}
