"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { NETWORK_ERROR } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { ActionResult, AppNotification, AppNotificationType } from "@/lib/types";

const NOTIFICATION_TYPES: AppNotificationType[] = [
  "change_request",
  "change_approved",
  "change_rejected",
  "notice",
];

function isNotificationType(value: string): value is AppNotificationType {
  return (NOTIFICATION_TYPES as string[]).includes(value);
}

function isMissingTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    (error.message ?? "").toLowerCase().includes("notifications")
  );
}

function mapNotification(row: {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string;
  read_at: string | null;
  created_at: string;
}): AppNotification | null {
  if (!isNotificationType(row.type)) return null;
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    url: row.url || "/",
    read_at: row.read_at,
    created_at: row.created_at,
  };
}

function revalidateNotificationViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
  revalidatePath("/app");
  revalidatePath("/app/notifications");
}

export async function listMyNotificationsAction(): Promise<
  ActionResult<AppNotification[]>
> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, url, read_at, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    if (isMissingTable(error)) return { ok: true, data: [] };
    return { ok: false, error: NETWORK_ERROR };
  }
  return {
    ok: true,
    data: (data ?? [])
      .map((row) =>
        mapNotification(
          row as {
            id: string;
            type: string;
            title: string;
            body: string;
            url: string;
            read_at: string | null;
            created_at: string;
          },
        ),
      )
      .filter((item): item is AppNotification => item !== null),
  };
}

export async function countUnreadNotificationsAction(): Promise<
  ActionResult<number>
> {
  if (!getSupabasePublicEnv()) return { ok: true, data: 0 };
  const profile = await requireProfile();
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .is("read_at", null);
  if (error) return { ok: true, data: 0 };
  return { ok: true, data: count ?? 0 };
}

export async function markNotificationReadAction(
  id: string,
): Promise<ActionResult<null>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", profile.id)
    .is("read_at", null);
  if (error) {
    if (isMissingTable(error)) return { ok: true, data: null };
    return { ok: false, error: NETWORK_ERROR };
  }
  revalidateNotificationViews();
  return { ok: true, data: null };
}

export async function markAllNotificationsReadAction(): Promise<
  ActionResult<null>
> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", profile.id)
    .is("read_at", null);
  if (error) {
    if (isMissingTable(error)) return { ok: true, data: null };
    return { ok: false, error: NETWORK_ERROR };
  }
  revalidateNotificationViews();
  return { ok: true, data: null };
}
