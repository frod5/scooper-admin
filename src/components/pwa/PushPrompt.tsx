"use client";

import { useEffect } from "react";
import { savePushSubscriptionAction } from "@/lib/push/actions";
import { registerPushWorker, subscribeToPush } from "@/lib/push/subscribe";

async function persistIfGranted() {
  if (typeof Notification === "undefined") return;
  await registerPushWorker();
  if (Notification.permission !== "granted") return;
  const sub = await subscribeToPush();
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
  await savePushSubscriptionAction({
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  });
}

export function PushPrompt() {
  useEffect(() => {
    void persistIfGranted().catch(() => undefined);
  }, []);
  return null;
}
