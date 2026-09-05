import { NoticesPage } from "@/components/notices/NoticesPage";
import { listNoticesAction } from "@/lib/notices/actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const notices = await listNoticesAction();
  return (
    <NoticesPage
      initialNotices={notices.ok ? notices.data : []}
      loadError={notices.ok ? undefined : notices.error}
      emptyMessage="받은 공지가 없습니다."
    />
  );
}
