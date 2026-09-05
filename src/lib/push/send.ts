import "server-only";

import webPush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseSecretKey } from "@/lib/supabase/env";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

function vapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey };
}

export async function sendPushToUserIds(
  userIds: string[],
  payload: PushPayload,
): Promise<{ failed: boolean }> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return { failed: false };
  const keys = vapid();
  if (!keys || !getSupabaseSecretKey()) return { failed: true };

  webPush.setVapidDetails(
    "mailto:scooper@internal.local",
    keys.publicKey,
    keys.privateKey,
  );

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", unique);
  if (error) return { failed: true };
  const subscriptions = rows ?? [];
  if (subscriptions.length === 0) return { failed: false };

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (row) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: row.endpoint as string,
            keys: {
              p256dh: row.p256dh as string,
              auth: row.auth as string,
            },
          },
          body,
        );
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await admin
            .from("push_subscriptions")
            .delete()
            .eq("id", row.id as string);
        }
        throw err;
      }
    }),
  );

  const sent = results.filter((item) => item.status === "fulfilled").length;
  return { failed: sent === 0 };
}

export async function notifyNoticeRecipients(input: {
  title: string;
  body: string;
  branchId: string | null;
}): Promise<{ failed: boolean }> {
  if (!getSupabaseSecretKey()) return { failed: true };
  const admin = createAdminClient();
  let query = admin
    .from("profiles")
    .select("id")
    .eq("role", "employee")
    .eq("status", "active");
  if (input.branchId) query = query.eq("branch_id", input.branchId);
  const { data, error } = await query;
  if (error) return { failed: true };
  return sendPushToUserIds(
    (data ?? []).map((row) => row.id as string),
    {
      title: input.title,
      body: input.body.slice(0, 80),
      url: "/app",
    },
  );
}

export async function notifySystemAdminsOfSupport(body: string): Promise<void> {
  if (!getSupabaseSecretKey()) return;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "system_admin")
    .eq("status", "active");
  if (error || !data) return;
  await sendPushToUserIds(
    data.map((row) => row.id as string),
    {
      title: "고객센터 요청",
      body: body.slice(0, 80),
      url: "/admin",
    },
  );
}

export async function notifyOwnersOfChangeRequest(): Promise<void> {
  if (!getSupabaseSecretKey()) return;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "owner")
    .eq("status", "active");
  if (error || !data) return;
  await sendPushToUserIds(
    data.map((row) => row.id as string),
    {
      title: "SCOOPER",
      body: "근무 변경 요청이 있습니다.",
      url: "/admin/requests",
    },
  );
}
