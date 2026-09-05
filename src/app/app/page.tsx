import { CalendarPage } from "@/components/calendar/CalendarPage";
import { requireEmployee } from "@/lib/auth/session";
import { yearMonthNow } from "@/lib/datetime";
import { listEmployeeMonthAction } from "@/lib/schedules/actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { year, month } = yearMonthNow();
  const [profile, result] = await Promise.all([
    requireEmployee(),
    listEmployeeMonthAction(year, month),
  ]);
  return (
    <CalendarPage
      mode="employee"
      profile={profile}
      initialYear={year}
      initialMonth={month}
      initialData={
        result.ok ? result.data : { assignments: [], requests: [] }
      }
      loadError={result.ok ? undefined : result.error}
    />
  );
}
