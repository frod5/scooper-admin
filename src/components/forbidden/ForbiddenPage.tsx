"use client";

import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[520px] text-center">
        <h1 className="text-22 text-ink">접근 권한이 없습니다</h1>
        <p className="mt-3 text-15 text-muted">
          이 페이지에 접근할 수 없습니다.
        </p>
        <div className="mt-8">
          <PrimaryButton onClick={() => router.replace("/app")}>
            돌아가기
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
