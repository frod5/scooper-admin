import { CalendarPage } from "@/components/calendar/CalendarPage";
import { requireStaff } from "@/lib/auth/session";
import { listBranchesAction } from "@/lib/branches/actions";
import { yearMonthNow } from "@/lib/datetime";
import { listDirectoryAction } from "@/lib/employees/actions";
import { roleLabel } from "@/lib/roles";
import { listAdminMonthAction } from "@/lib/schedules/actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const profile = await requireStaff();
  const { year, month } = yearMonthNow();
  const [branches, monthData, people] = await Promise.all([
    listBranchesAction(),
    listAdminMonthAction(year, month, "all"),
    listDirectoryAction(),
  ]);
  const loadError = !branches.ok
    ? branches.error
    : !monthData.ok
      ? monthData.error
      : undefined;

  return (
    <CalendarPage
      mode="admin"
      profile={profile}
      userName={profile.name}
      userRoleLabel={roleLabel(profile.role)}
      initialBranches={branches.ok ? branches.data : []}
      initialPeople={people.ok ? people.data : []}
      initialYear={year}
      initialMonth={month}
      initialData={
        monthData.ok ? monthData.data : { assignments: [], requests: [] }
      }
      loadError={loadError}
    />
  );
}
