import { EmployeeShell } from "@/components/shell/EmployeeShell";
import { requireEmployee } from "@/lib/auth/session";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function myPendingCount(userId: string) {
  if (!getSupabasePublicEnv()) return 0;
  const supabase = await createClient();
  const { count } = await supabase
    .from("schedule_change_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "pending");
  return count ?? 0;
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireEmployee();
  const pendingCount = await myPendingCount(profile.id);
  return (
    <EmployeeShell
      userName={profile.name}
      branchName={profile.branch_name}
      pendingCount={pendingCount}
    >
      {children}
    </EmployeeShell>
  );
}
