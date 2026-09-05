import { AdminSettingsScreen } from "@/components/profile/AdminSettingsScreen";
import { requireStaff } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const profile = await requireStaff();
  return <AdminSettingsScreen role={profile.role} />;
}
