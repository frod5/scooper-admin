import type { UserRole } from "@/lib/types";

export function isStaffRole(role: UserRole): boolean {
  return role === "system_admin" || role === "owner";
}

export function roleLabel(role: UserRole): string {
  if (role === "system_admin") return "시스템관리자";
  if (role === "owner") return "대표";
  return "직원";
}

export function homePath(role: UserRole): string {
  return isStaffRole(role) ? "/admin" : "/app";
}
