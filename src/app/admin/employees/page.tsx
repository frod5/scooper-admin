import { EmployeesPage } from "@/components/employees/EmployeesPage";
import { listBranchesAction } from "@/lib/branches/actions";
import { listDirectoryAction } from "@/lib/employees/actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [people, branches] = await Promise.all([
    listDirectoryAction(),
    listBranchesAction(),
  ]);
  const loadError = !people.ok
    ? people.error
    : !branches.ok
      ? branches.error
      : undefined;

  return (
    <EmployeesPage
      initialPeople={people.ok ? people.data : []}
      initialBranches={branches.ok ? branches.data : []}
      loadError={loadError}
    />
  );
}
