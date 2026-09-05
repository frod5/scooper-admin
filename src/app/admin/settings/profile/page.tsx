import { EmployeeProfileForm } from "@/components/profile/EmployeeProfileForm";
import { requireStaff } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const profile = await requireStaff();
  return (
    <div className="flex flex-col gap-8 pb-8">
      <EmployeeProfileForm profile={profile} showBranch={false} />
    </div>
  );
}
