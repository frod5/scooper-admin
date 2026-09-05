import { EmployeeShell } from "@/components/shell/EmployeeShell";
import { requireEmployee } from "@/lib/auth/session";
import { countUnreadNotificationsAction } from "@/lib/notifications/actions";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function myPendingCount() {
  if (!getSupabasePublicEnv()) return 0;
  const profile = await requireEmployee();
  const supabase = await createClient();
  const { count } = await supabase
    .from("schedule_change_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("status", "pending");
  return count ?? 0;
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, pendingCount, unread] = await Promise.all([
    requireEmployee(),
    myPendingCount(),
    countUnreadNotificationsAction(),
  ]);
  return (
    <EmployeeShell
      userName={profile.name}
      branchName={profile.branch_name}
      pendingCount={pendingCount}
      unreadCount={unread.ok ? unread.data : 0}
    >
      {children}
    </EmployeeShell>
  );
}
