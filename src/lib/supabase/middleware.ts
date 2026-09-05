import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { isStaffRole } from "@/lib/roles";
import type { UserRole, UserStatus } from "@/lib/types";

function copySessionCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  return to;
}

function redirectWithSession(
  request: NextRequest,
  supabaseResponse: NextResponse,
  pathname: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return copySessionCookies(supabaseResponse, NextResponse.redirect(url));
}

function isLoginPath(pathname: string) {
  return pathname === "/login";
}

function isAppPath(pathname: string) {
  return pathname === "/app" || pathname.startsWith("/app/");
}

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export async function updateSession(request: NextRequest) {
  const env = getSupabasePublicEnv();
  const pathname = request.nextUrl.pathname;

  if (!env) {
    if (!isLoginPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) =>
          supabaseResponse.headers.set(key, value),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    if (!isLoginPath(pathname)) {
      return redirectWithSession(request, supabaseResponse, "/login");
    }
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.sub)
    .maybeSingle();

  const role = profile?.role as UserRole | undefined;
  const status = profile?.status as UserStatus | undefined;

  if (!profile || !role || status === "resigned") {
    if (!isLoginPath(pathname)) {
      return redirectWithSession(request, supabaseResponse, "/login");
    }
    return supabaseResponse;
  }

  if (isLoginPath(pathname) || pathname === "/") {
    return redirectWithSession(
      request,
      supabaseResponse,
      isStaffRole(role) ? "/admin" : "/app",
    );
  }

  if (isAppPath(pathname) && isStaffRole(role)) {
    return redirectWithSession(request, supabaseResponse, "/admin");
  }

  if (isAdminPath(pathname) && !isStaffRole(role)) {
    return redirectWithSession(request, supabaseResponse, "/forbidden");
  }

  return supabaseResponse;
}
