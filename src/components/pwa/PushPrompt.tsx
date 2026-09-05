"use client";

import { useEffect, useState } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import {
  canUseWebPush,
  needsHomeScreenForPush,
  persistPushSubscription,
  registerPushWorker,
} from "@/lib/push/subscribe";

export function PushPrompt() {
  const [needTap, setNeedTap] = useState(false);
  const [homescreen, setHomescreen] = useState(false);

  useEffect(() => {
    void setup();
  }, []);

  async function setup() {
    if (!canUseWebPush()) return;
    if (needsHomeScreenForPush()) {
      setHomescreen(true);
      setNeedTap(true);
      return;
    }
    await registerPushWorker().catch(() => undefined);
    if (Notification.permission === "granted") {
      await persistPushSubscription().catch(() => undefined);
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await persistPushSubscription();
        return;
      }
    } catch {
      // 제스처 없이 막히면 버튼으로 다시 요청
    }
    setNeedTap(true);
  }

  async function enable() {
    try {
      if (needsHomeScreenForPush()) return;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
      await persistPushSubscription();
      setNeedTap(false);
    } catch {
      // 허용될 때까지 배너 유지
    }
  }

  if (!needTap) return null;

  return (
    <div className="mb-3 rounded-16 bg-accent-soft px-4 py-3 shadow-card">
      <p className="text-15 text-ink">
        {homescreen
          ? "아이폰은 홈 화면에 추가한 앱에서 알림을 받을 수 있어요."
          : "근무 변경과 공지 알림을 받으려면 허용해 주세요."}
      </p>
      {homescreen ? null : (
        <PrimaryButton className="mt-3" onClick={() => void enable()}>
          알림 켜기
        </PrimaryButton>
      )}
    </div>
  );
}
