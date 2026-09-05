"use client";

import { useEffect, useState } from "react";
import { ListRow } from "@/components/ui/ListRow";
import {
  canUseWebPush,
  needsHomeScreenForPush,
  persistPushSubscription,
} from "@/lib/push/subscribe";

type PushState = "loading" | "unsupported" | "homescreen" | "on" | "off" | "blocked";

function currentState(): PushState {
  if (!canUseWebPush()) return "unsupported";
  if (needsHomeScreenForPush()) return "homescreen";
  if (Notification.permission === "granted") return "on";
  if (Notification.permission === "denied") return "blocked";
  return "off";
}

function subtitleOf(state: PushState) {
  switch (state) {
    case "on":
      return "켜짐";
    case "off":
      return "탭해서 알림을 허용하세요";
    case "blocked":
      return "브라우저 설정에서 알림을 허용해 주세요";
    case "homescreen":
      return "홈 화면에 추가한 뒤 켤 수 있어요";
    case "unsupported":
      return "이 기기에서는 푸시를 지원하지 않습니다";
    default:
      return "";
  }
}

export function PushSettingsRow() {
  const [state, setState] = useState<PushState>("loading");

  useEffect(() => {
    const next = currentState();
    setState(next);
    if (next === "on") {
      void persistPushSubscription().catch(() => undefined);
    }
  }, []);

  async function enable() {
    if (state !== "off") return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await persistPushSubscription();
        setState("on");
        return;
      }
      setState(permission === "denied" ? "blocked" : "off");
    } catch {
      setState("off");
    }
  }

  if (state === "loading") return null;

  return (
    <ListRow
      title="푸시 알림"
      subtitle={subtitleOf(state)}
      showChevron={state === "off"}
      onClick={state === "off" ? () => void enable() : undefined}
    />
  );
}
