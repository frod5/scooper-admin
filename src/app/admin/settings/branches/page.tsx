import { BranchesPage } from "@/components/branches/BranchesPage";
import { listBranchesAction } from "@/lib/branches/actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const result = await listBranchesAction();
  return (
    <BranchesPage
      initialBranches={result.ok ? result.data : []}
      loadError={result.ok ? undefined : result.error}
    />
  );
}
