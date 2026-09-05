export function isDuplicateError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  if (candidate.code === "23505" || candidate.code === "email_exists") {
    return true;
  }
  const message = (candidate.message ?? "").toLowerCase();
  return (
    message.includes("duplicate") ||
    message.includes("already been registered") ||
    message.includes("already exists") ||
    message.includes("unique")
  );
}

export const NETWORK_ERROR = "연결에 실패했습니다. 다시 시도하세요.";
export const BRANCH_HAS_EMPLOYEES =
  "해당지점에서 근무하는 직원이 있습니다.";
