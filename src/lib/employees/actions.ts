"use server";

import { revalidatePath } from "next/cache";
import { INITIAL_PASSWORD } from "@/lib/auth/constants";
import { createAccount, updateAuthLoginPhone } from "@/lib/auth/create-account";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/session";
import { NETWORK_ERROR, isDuplicateError } from "@/lib/errors";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type {
  ActionResult,
  DirectoryPerson,
  UserRole,
  UserStatus,
} from "@/lib/types";

type ProfileRow = {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  branch_id: string | null;
  branches: { name: string } | { name: string }[] | null;
};

function mapPerson(row: ProfileRow): DirectoryPerson {
  const branch = row.branches;
  const branchName = Array.isArray(branch)
    ? (branch[0]?.name ?? null)
    : (branch?.name ?? null);
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    role: row.role,
    status: row.status,
    branch_id: row.branch_id,
    branch_name: branchName,
  };
}

export async function listDirectoryAction(): Promise<
  ActionResult<DirectoryPerson[]>
> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  const staff = await requireStaff();

  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("id, phone, name, role, status, branch_id, branches ( name )")
    .eq("status", "active")
    .order("name");
  if (staff.role !== "system_admin") {
    query = query.eq("role", "employee");
  }

  const { data, error } = await query;

  if (error) return { ok: false, error: NETWORK_ERROR };
  return { ok: true, data: ((data ?? []) as ProfileRow[]).map(mapPerson) };
}

export async function issueEmployeeAction(input: {
  name: string;
  phone: string;
  branchId: string;
  branchName: string;
}): Promise<ActionResult<DirectoryPerson>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  await requireStaff();

  const name = input.name.trim();
  const phone = normalizePhone(input.phone);
  if (!name) return { ok: false, error: "이름을 입력하세요." };
  if (!isValidPhone(phone)) return { ok: false, error: "전화번호를 확인하세요" };
  if (!input.branchId) return { ok: false, error: "지점을 선택하세요." };

  try {
    const user = await createAccount({
      name,
      phone,
      role: "employee",
      branchId: input.branchId,
    });
    revalidatePath("/admin/employees");
    revalidatePath("/admin/branches");
    revalidatePath("/admin/settings/branches");
    return {
      ok: true,
      data: {
        id: user.id,
        name,
        phone,
        role: "employee",
        status: "active",
        branch_id: input.branchId,
        branch_name: input.branchName,
      },
    };
  } catch (error) {
    if (isDuplicateError(error)) {
      return { ok: false, error: "이미 등록된 전화번호입니다." };
    }
    return { ok: false, error: NETWORK_ERROR };
  }
}

export async function issueOwnerAction(input: {
  name: string;
  phone: string;
}): Promise<ActionResult<DirectoryPerson>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  const actor = await requireStaff();
  if (actor.role !== "system_admin") {
    return { ok: false, error: "접근 권한이 없습니다" };
  }

  const name = input.name.trim();
  const phone = normalizePhone(input.phone);
  if (!name) return { ok: false, error: "이름을 입력하세요." };
  if (!isValidPhone(phone)) return { ok: false, error: "전화번호를 확인하세요" };

  try {
    const user = await createAccount({
      name,
      phone,
      role: "owner",
    });
    revalidatePath("/admin/employees");
    return {
      ok: true,
      data: {
        id: user.id,
        name,
        phone,
        role: "owner",
        status: "active",
        branch_id: null,
        branch_name: null,
      },
    };
  } catch (error) {
    if (isDuplicateError(error)) {
      return { ok: false, error: "이미 등록된 전화번호입니다." };
    }
    return { ok: false, error: NETWORK_ERROR };
  }
}

export async function updateEmployeeAction(input: {
  id: string;
  name: string;
  phone: string;
  branchId: string | null;
}): Promise<ActionResult<DirectoryPerson>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  await requireStaff();

  const name = input.name.trim();
  const phone = normalizePhone(input.phone);
  if (!name) return { ok: false, error: "이름을 입력하세요." };
  if (!isValidPhone(phone)) return { ok: false, error: "전화번호를 확인하세요" };

  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from("profiles")
    .select("id, phone, name, role, status, branch_id, branches ( name )")
    .eq("id", input.id)
    .maybeSingle();

  if (currentError || !current) return { ok: false, error: NETWORK_ERROR };
  const currentPerson = mapPerson(current as ProfileRow);

  if (currentPerson.role === "employee" && !input.branchId) {
    return { ok: false, error: "지점을 선택하세요." };
  }

  if (phone !== currentPerson.phone) {
    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone", phone)
      .neq("id", input.id)
      .maybeSingle();
    if (taken) return { ok: false, error: "이미 등록된 전화번호입니다." };
  }

  const branchId =
    currentPerson.role === "employee" ? input.branchId : null;

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({
      name,
      phone,
      branch_id: branchId,
    })
    .eq("id", input.id)
    .select("id, phone, name, role, status, branch_id, branches ( name )")
    .single();

  if (error) {
    if (isDuplicateError(error)) {
      return { ok: false, error: "이미 등록된 전화번호입니다." };
    }
    return { ok: false, error: NETWORK_ERROR };
  }

  if (phone !== currentPerson.phone) {
    try {
      await updateAuthLoginPhone(input.id, phone);
    } catch {
      await supabase
        .from("profiles")
        .update({ phone: currentPerson.phone })
        .eq("id", input.id);
      return { ok: false, error: NETWORK_ERROR };
    }
  }

  revalidatePath("/admin/employees");
  revalidatePath("/admin/branches");
  revalidatePath("/admin/settings/branches");
  return { ok: true, data: mapPerson(updated as ProfileRow) };
}

export async function setEmployeeStatusAction(input: {
  id: string;
  status: UserStatus;
}): Promise<ActionResult<DirectoryPerson>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  await requireStaff();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ status: input.status })
    .eq("id", input.id)
    .eq("role", "employee")
    .select("id, phone, name, role, status, branch_id, branches ( name )")
    .single();

  if (error) return { ok: false, error: NETWORK_ERROR };

  revalidatePath("/admin/employees");
  revalidatePath("/admin/branches");
  revalidatePath("/admin/settings/branches");
  return { ok: true, data: mapPerson(data as ProfileRow) };
}

function passwordResetError(error: { message?: string } | null) {
  const message = (error?.message ?? "").toLowerCase();
  if (
    message.includes("leaked") ||
    message.includes("pwned") ||
    message.includes("easy to guess") ||
    message.includes("too common")
  ) {
    return "123456은 너무 쉬운 비밀번호로 서버에서 막혔습니다. 대시보드 비밀번호 정책을 확인해 주세요.";
  }
  if (
    message.includes("at least") ||
    message.includes("characters") ||
    message.includes("length") ||
    message.includes("too short")
  ) {
    return "서버 비밀번호 최소 길이 때문에 123456으로 바꿀 수 없습니다.";
  }
  if (message.includes("not found") || message.includes("user not found")) {
    return "계정을 찾지 못했습니다.";
  }
  return NETWORK_ERROR;
}

export async function resetPasswordToInitialAction(
  userId: string,
): Promise<ActionResult<null>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  const actor = await requireStaff();
  if (actor.role !== "system_admin") {
    return { ok: false, error: "접근 권한이 없습니다" };
  }
  if (actor.id === userId) {
    return { ok: false, error: "본인 비밀번호는 설정에서 바꾸세요." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }

  const { data: target, error: loadError } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();
  if (loadError) return { ok: false, error: NETWORK_ERROR };
  if (!target) return { ok: false, error: "계정을 찾지 못했습니다." };
  if (target.role !== "employee" && target.role !== "owner") {
    return { ok: false, error: "접근 권한이 없습니다" };
  }

  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: INITIAL_PASSWORD,
  });
  if (error) return { ok: false, error: passwordResetError(error) };
  return { ok: true, data: null };
}
