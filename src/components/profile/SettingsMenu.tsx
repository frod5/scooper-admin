"use client";

import { useRouter } from "next/navigation";
import { ListRow } from "@/components/ui/ListRow";

export function SettingsMenu({
  profileHref,
  branchesHref,
  noticesHref,
  noticesLabel,
  supportLabel,
  onSupport,
}: {
  profileHref: string;
  branchesHref?: string;
  noticesHref?: string;
  noticesLabel?: string;
  supportLabel?: string;
  onSupport?: () => void;
}) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-3">
      <ListRow
        title="회원정보관리"
        onClick={() => router.push(profileHref)}
      />
      {branchesHref ? (
        <ListRow
          title="지점관리"
          onClick={() => router.push(branchesHref)}
        />
      ) : null}
      {noticesHref ? (
        <ListRow
          title={noticesLabel ?? "공지 알림 내역"}
          onClick={() => router.push(noticesHref)}
        />
      ) : null}
      {supportLabel && onSupport ? (
        <ListRow title={supportLabel} onClick={onSupport} />
      ) : null}
    </div>
  );
}
