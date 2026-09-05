"use client";

import { Dialog } from "@/components/ui/Dialog";
import { GhostButton } from "@/components/ui/GhostButton";

export function InstallGuideSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} title="홈 화면에 추가" onClose={onClose}>
      <ol className="list-decimal space-y-3 pl-5 text-15 text-ink">
        <li>하단 공유 버튼(□↑)을 누릅니다.</li>
        <li>「홈 화면에 추가」를 누릅니다.</li>
        <li>추가를 누르면 홈 화면에 SCOOPER가 생깁니다.</li>
      </ol>
      <GhostButton className="mt-6" onClick={onClose}>
        닫기
      </GhostButton>
    </Dialog>
  );
}
