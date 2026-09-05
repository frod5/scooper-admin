import { AdminRequestsPage } from "@/components/requests/AdminRequestsPage";
import { listBranchesAction } from "@/lib/branches/actions";
import { listPendingChangeRequestsAction } from "@/lib/schedules/actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [requests, branches] = await Promise.all([
    listPendingChangeRequestsAction(),
    listBranchesAction(),
  ]);
  const loadError = !requests.ok
    ? requests.error
    : !branches.ok
      ? branches.error
      : undefined;

  return (
    <AdminRequestsPage
      initialRequests={requests.ok ? requests.data : []}
      initialBranches={branches.ok ? branches.data : []}
      loadError={loadError}
    />
  );
}
