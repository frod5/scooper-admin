"use server";

import { requireProfile } from "@/lib/auth/session";
import { NETWORK_ERROR } from "@/lib/errors";
import { notifySystemAdminsOfSupport } from "@/lib/push/send";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, SupportTicket, UserRole } from "@/lib/types";

type TicketRow = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles:
    | { name: string; role: UserRole }
    | { name: string; role: UserRole }[]
    | null;
};

function mapTicket(row: TicketRow): SupportTicket {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    user_id: row.user_id,
    name: profile?.name ?? "",
    role: profile?.role ?? "employee",
    body: row.body,
    created_at: row.created_at,
  };
}

export async function createSupportTicketAction(input: {
  body: string;
}): Promise<ActionResult<SupportTicket> & { pushFailed?: boolean }> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  const profile = await requireProfile();
  if (profile.role !== "employee" && profile.role !== "owner") {
    return { ok: false, error: NETWORK_ERROR };
  }
  const body = input.body.trim();
  if (!body) return { ok: false, error: "요청사항을 입력하세요." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({ user_id: profile.id, body })
    .select("id, user_id, body, created_at")
    .single();
  if (error || !data) return { ok: false, error: NETWORK_ERROR };

  try {
    await notifySystemAdminsOfSupport(body);
  } catch {
    return {
      ok: true,
      data: {
        id: data.id as string,
        user_id: profile.id,
        name: profile.name,
        role: profile.role,
        body,
        created_at: data.created_at as string,
      },
      pushFailed: true,
    };
  }

  return {
    ok: true,
    data: {
      id: data.id as string,
      user_id: profile.id,
      name: profile.name,
      role: profile.role,
      body,
      created_at: data.created_at as string,
    },
  };
}

export async function listSupportTicketsAction(): Promise<
  ActionResult<SupportTicket[]>
> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  const profile = await requireProfile();
  if (profile.role !== "system_admin") return { ok: false, error: NETWORK_ERROR };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, user_id, body, created_at, profiles!user_id ( name, role )")
    .order("created_at", { ascending: false });
  if (error) return { ok: false, error: NETWORK_ERROR };
  return { ok: true, data: ((data ?? []) as TicketRow[]).map(mapTicket) };
}
