import { EmployeeProfileForm } from "@/components/profile/EmployeeProfileForm";
import { requireEmployee } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function EmployeeProfilePage() {
  const profile = await requireEmployee();
  return (
    <div className="flex flex-col gap-8 pb-8">
      <EmployeeProfileForm profile={profile} />
    </div>
  );
}
