import { Spinner } from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg">
      <Spinner />
      <p className="mt-3 text-13 text-muted">불러오는 중</p>
    </div>
  );
}
