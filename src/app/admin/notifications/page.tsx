import { NotificationsPage } from "@/components/notifications/NotificationsPage";
import { listMyNotificationsAction } from "@/lib/notifications/actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const result = await listMyNotificationsAction();
  return (
    <NotificationsPage
      initialItems={result.ok ? result.data : []}
      loadError={result.ok ? undefined : result.error}
    />
  );
}
