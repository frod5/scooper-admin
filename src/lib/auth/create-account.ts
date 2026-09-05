import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { INITIAL_PASSWORD } from "@/lib/auth/constants";
import { normalizePhone, phoneToEmail } from "@/lib/phone";
import type { UserRole } from "@/lib/types";

export async function createAccount(input: {
  name: string;
  phone: string;
  role: UserRole;
  branchId?: string | null;
}) {
  const admin = createAdminClient();
  const phone = normalizePhone(input.phone);
  const email = phoneToEmail(phone);

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: INITIAL_PASSWORD,
    email_confirm: true,
    user_metadata: {
      name: input.name,
      phone,
      role: input.role,
    },
  });

  if (error || !data.user) {
    throw error ?? new Error("계정 생성에 실패했습니다.");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    phone,
    name: input.name,
    role: input.role,
    status: "active",
    branch_id: input.role === "employee" ? input.branchId : null,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw profileError;
  }

  return data.user;
}

export async function updateAuthLoginPhone(userId: string, phone: string) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    email: phoneToEmail(phone),
    email_confirm: true,
    user_metadata: { phone },
  });
  if (error) throw error;
}
