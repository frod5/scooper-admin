"use client";

import { InstallGuideSheet } from "@/components/pwa/InstallGuideSheet";
import { useInstallPrompt } from "@/components/pwa/useInstallPrompt";

export function InstallHomeButton() {
  const { show, addToHome, guideOpen, setGuideOpen } = useInstallPrompt();
  if (!show) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => void addToHome()}
        className="h-8 shrink-0 rounded-pill bg-surface-2 px-3 text-13 font-semibold text-ink"
      >
        홈 추가
      </button>
      <InstallGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}
