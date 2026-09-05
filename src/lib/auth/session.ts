import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { homePath } from "@/lib/roles";
import type { Profile, UserRole, UserStatus } from "@/lib/types";

type ProfileRow = {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  branch_id: string | null;
  branches: { name: string } | { name: string }[] | null;
};

function branchNameOf(row: ProfileRow): string | null {
  const branch = row.branches;
  if (!branch) return null;
  if (Array.isArray(branch)) return branch[0]?.name ?? null;
  return branch.name ?? null;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!getSupabasePublicEnv()) return null;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId || typeof userId !== "string") return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, phone, name, role, status, branch_id, branches ( name )")
    .eq("id", userId)
    .maybeSingle();

  if (!data) return null;

  const row = data as ProfileRow;
  if (row.status === "resigned") {
    await supabase.auth.signOut();
    return null;
  }

  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    role: row.role,
    status: row.status,
    branch_id: row.branch_id,
    branch_name: branchNameOf(row),
  };
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireEmployee(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "employee") redirect(homePath(profile.role));
  return profile;
}

export async function requireStaff(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role === "employee") redirect("/forbidden");
  return profile;
}
