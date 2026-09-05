"use client";

import { useEffect, useState } from "react";
import { GhostButton } from "@/components/ui/GhostButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import {
  canUseWebPush,
  needsHomeScreenForPush,
  persistPushSubscription,
  registerPushWorker,
} from "@/lib/push/subscribe";

const STORAGE_KEY = "scooper.pushPrompt.dismissedAt";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function isDismissed() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  return !Number.isNaN(dismissedAt) && Date.now() - dismissedAt < WEEK_MS;
}

export function PushPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    void setup();
  }, []);

  async function setup() {
    if (!canUseWebPush() || needsHomeScreenForPush()) return;
    await registerPushWorker().catch(() => undefined);
    if (Notification.permission === "granted") {
      await persistPushSubscription().catch(() => undefined);
      return;
    }
    if (Notification.permission === "denied") return;
    if (isDismissed()) return;
    setShow(true);
  }

  async function enable() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await persistPushSubscription();
      }
    } catch {
      // 권한 창을 닫거나 구독 실패해도 배너는 내림
    }
    setShow(false);
  }

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="mb-3 rounded-16 bg-accent-soft px-4 py-3 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-15 text-ink">
          근무 변경과 공지를 받으려면 알림을 허용해 주세요.
        </p>
        <GhostButton
          onClick={dismiss}
          className="h-auto w-auto px-0 text-13 text-muted"
        >
          닫기
        </GhostButton>
      </div>
      <PrimaryButton className="mt-3" onClick={() => void enable()}>
        알림 받기
      </PrimaryButton>
    </div>
  );
}
