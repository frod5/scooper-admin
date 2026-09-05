"use server";

import { revalidatePath } from "next/cache";
import { requireProfile, requireStaff } from "@/lib/auth/session";
import { NETWORK_ERROR } from "@/lib/errors";
import { notifyNoticeRecipients } from "@/lib/push/send";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { ActionResult, Notice } from "@/lib/types";

type NoticeRow = {
  id: string;
  author_id: string;
  branch_id: string | null;
  title: string;
  body: string;
  created_at: string;
  branches: { name: string } | { name: string }[] | null;
};

function mapNotice(row: NoticeRow): Notice {
  const branch = row.branches;
  const branchName = Array.isArray(branch)
    ? (branch[0]?.name ?? null)
    : (branch?.name ?? null);
  return {
    id: row.id,
    author_id: row.author_id,
    branch_id: row.branch_id,
    branch_name: row.branch_id ? branchName : null,
    title: row.title,
    body: row.body,
    created_at: row.created_at,
  };
}

export async function listNoticesAction(): Promise<ActionResult<Notice[]>> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  const profile = await requireProfile();
  const supabase = await createClient();
  let query = supabase
    .from("notices")
    .select("id, author_id, branch_id, title, body, created_at, branches ( name )")
    .order("created_at", { ascending: false });
  if (profile.role === "employee") {
    if (profile.branch_id) {
      query = query.or(
        `branch_id.is.null,branch_id.eq.${profile.branch_id}`,
      );
    } else {
      query = query.is("branch_id", null);
    }
  }
  const { data, error } = await query;
  if (error) return { ok: false, error: NETWORK_ERROR };
  const notices = ((data ?? []) as NoticeRow[]).map(mapNotice);
  if (profile.role === "employee") {
    return {
      ok: true,
      data: notices.filter(
        (item) => !item.branch_id || item.branch_id === profile.branch_id,
      ),
    };
  }
  return { ok: true, data: notices };
}

export async function createNoticeAction(input: {
  title: string;
  body: string;
  branchId: string | null;
}): Promise<ActionResult<Notice> & { pushFailed?: boolean }> {
  if (!getSupabasePublicEnv()) return { ok: false, error: NETWORK_ERROR };
  const staff = await requireStaff();
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) return { ok: false, error: "제목을 입력하세요." };
  if (!body) return { ok: false, error: "내용을 입력하세요." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notices")
    .insert({
      author_id: staff.id,
      branch_id: input.branchId,
      title,
      body,
    })
    .select("id, author_id, branch_id, title, body, created_at, branches ( name )")
    .single();
  if (error || !data) return { ok: false, error: NETWORK_ERROR };

  const notice = mapNotice(data as NoticeRow);
  const push = await notifyNoticeRecipients({
    title: notice.title,
    body: notice.body,
    branchId: notice.branch_id,
  });
  revalidatePath("/admin/notices");
  revalidatePath("/admin/settings/notices");
  revalidatePath("/app/settings/notices");
  return { ok: true, data: notice, pushFailed: push.failed };
}
