import { AdminShell } from "@/components/shell/AdminShell";
import { requireStaff } from "@/lib/auth/session";
import { listBranchesAction } from "@/lib/branches/actions";
import { countUnreadNotificationsAction } from "@/lib/notifications/actions";
import { roleLabel } from "@/lib/roles";
import { countPendingChangeRequestsAction } from "@/lib/schedules/actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, pending, branches, unread] = await Promise.all([
    requireStaff(),
    countPendingChangeRequestsAction(),
    listBranchesAction(),
    countUnreadNotificationsAction(),
  ]);
  return (
    <AdminShell
      userName={profile.name}
      userRole={profile.role}
      userRoleLabel={roleLabel(profile.role)}
      pendingCount={pending.ok ? pending.data : 0}
      unreadCount={unread.ok ? unread.data : 0}
      branches={branches.ok ? branches.data : []}
    >
      {children}
    </AdminShell>
  );
}
