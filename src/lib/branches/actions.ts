"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import {
  BRANCH_HAS_EMPLOYEES,
  NETWORK_ERROR,
  isDuplicateError,
} from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { ActionResult, Branch } from "@/lib/types";

const loadBranches = cache(async (): Promise<ActionResult<Branch[]>> => {
  const supabase = await createClient();
  const [branchRes, employeeRes] = await Promise.all([
    supabase.from("branches").select("id, name").order("name"),
    supabase
      .from("profiles")
      .select("branch_id")
      .eq("role", "employee")
      .eq("status", "active"),
  ]);

  if (branchRes.error || employeeRes.error) {
    return { ok: false, error: NETWORK_ERROR };
  }

  const counts = new Map<string, number>();
  for (const row of employeeRes.data ?? []) {
    if (!row.branch_id) continue;
    counts.set(row.branch_id, (counts.get(row.branch_id) ?? 0) + 1);
  }

  return {
    ok: true,
    data: (branchRes.data ?? []).map((branch) => ({
      id: branch.id as string,
      name: branch.name as string,
      activeEmployeeCount: counts.get(branch.id as string) ?? 0,
    })),
  };
});

export async function listBranchesAction(): Promise<ActionResult<Branch[]>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  await requireStaff();
  return loadBranches();
}

export async function createBranchAction(
  name: string,
): Promise<ActionResult<Branch>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  await requireStaff();

  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "지점 이름을 입력하세요." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("branches")
    .insert({ name: trimmed })
    .select("id, name")
    .single();

  if (error) {
    if (isDuplicateError(error)) {
      return { ok: false, error: "같은 이름의 지점이 있습니다." };
    }
    return { ok: false, error: NETWORK_ERROR };
  }

  revalidatePath("/admin/branches");
  revalidatePath("/admin/settings/branches");
  return {
    ok: true,
    data: {
      id: data.id as string,
      name: data.name as string,
      activeEmployeeCount: 0,
    },
  };
}

export async function updateBranchAction(
  id: string,
  name: string,
): Promise<ActionResult<Branch>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  await requireStaff();

  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "지점 이름을 입력하세요." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("branches")
    .update({ name: trimmed })
    .eq("id", id)
    .select("id, name")
    .single();

  if (error) {
    if (isDuplicateError(error)) {
      return { ok: false, error: "같은 이름의 지점이 있습니다." };
    }
    return { ok: false, error: NETWORK_ERROR };
  }

  revalidatePath("/admin/branches");
  revalidatePath("/admin/settings/branches");
  revalidatePath("/admin/employees");
  return {
    ok: true,
    data: {
      id: data.id as string,
      name: data.name as string,
      activeEmployeeCount: 0,
    },
  };
}

export async function deleteBranchAction(
  id: string,
): Promise<ActionResult<null>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  await requireStaff();

  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "employee")
    .eq("branch_id", id);
  if (countError) return { ok: false, error: NETWORK_ERROR };
  if ((count ?? 0) > 0) {
    return { ok: false, error: BRANCH_HAS_EMPLOYEES };
  }

  const { error } = await supabase.from("branches").delete().eq("id", id);
  if (error) {
    if (
      error.code === "23503" ||
      (error.message ?? "").toLowerCase().includes("foreign key")
    ) {
      return { ok: false, error: BRANCH_HAS_EMPLOYEES };
    }
    return { ok: false, error: NETWORK_ERROR };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/branches");
  revalidatePath("/admin/settings/branches");
  revalidatePath("/admin/employees");
  return { ok: true, data: null };
}
