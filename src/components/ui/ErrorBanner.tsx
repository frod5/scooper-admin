export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-16 bg-danger-soft px-4 py-3 text-13 text-danger">
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 text-13 text-danger"
        >
          다시 시도
        </button>
      ) : null}
    </div>
  );
}
