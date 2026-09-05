import "server-only";

import webPush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseSecretKey } from "@/lib/supabase/env";
import type { AppNotificationType } from "@/lib/types";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

type InAppPayload = {
  type: AppNotificationType;
  title: string;
  body: string;
  url: string;
};

function vapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey };
}

function vapidSubject() {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site?.startsWith("https://")) return site;
  return "https://scooper-admin.vercel.app";
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
    vapidSubject(),
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
          { TTL: 86400 },
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

async function persistNotifications(
  userIds: string[],
  payload: InAppPayload,
): Promise<void> {
  if (userIds.length === 0 || !getSupabaseSecretKey()) return;
  try {
    const admin = createAdminClient();
    await admin.from("notifications").insert(
      userIds.map((user_id) => ({
        user_id,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        url: payload.url,
      })),
    );
  } catch {
    // 테이블이 아직 없거나 저장 실패해도 푸시는 보냄.
  }
}

export async function notifyUsers(
  userIds: string[],
  payload: InAppPayload,
): Promise<{ failed: boolean }> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return { failed: false };
  await persistNotifications(unique, payload);
  return sendPushToUserIds(unique, {
    title: payload.title,
    body: payload.body.slice(0, 80),
    url: payload.url,
  });
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
  return notifyUsers(
    (data ?? []).map((row) => row.id as string),
    {
      type: "notice",
      title: input.title,
      body: input.body,
      url: "/app/settings/notices",
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

export async function notifyStaffOfChangeRequest(input: {
  employeeName: string;
  excludeUserId?: string;
}): Promise<void> {
  if (!getSupabaseSecretKey()) return;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .in("role", ["owner", "system_admin"])
    .eq("status", "active");
  if (error || !data) return;
  const ids = data
    .map((row) => row.id as string)
    .filter((id) => id !== input.excludeUserId);
  await notifyUsers(ids, {
    type: "change_request",
    title: "근무 변경 요청",
    body: `${input.employeeName}님이 근무 변경을 요청했습니다.`,
    url: "/admin/requests",
  });
}

export async function notifyEmployeeOfChangeDecision(input: {
  userId: string;
  approved: boolean;
}): Promise<void> {
  await notifyUsers([input.userId], {
    type: input.approved ? "change_approved" : "change_rejected",
    title: input.approved ? "근무 변경 승인" : "근무 변경 거절",
    body: input.approved
      ? "근무 변경 요청이 승인되었습니다."
      : "근무 변경 요청이 거절되었습니다.",
    url: "/app/requests",
  });
}
