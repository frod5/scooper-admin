import type { ReactNode } from "react";

export function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-15 text-muted">{message}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
