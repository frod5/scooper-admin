"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { InstallGuideSheet } from "@/components/pwa/InstallGuideSheet";
import { GhostButton } from "@/components/ui/GhostButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

const STORAGE_KEY = "scooper.installBanner.dismissedAt";
const DISMISS_EVENT = "scooper-install-dismiss";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function isDismissed() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  return !Number.isNaN(dismissedAt) && Date.now() - dismissedAt < WEEK_MS;
}

function subscribeStandalone(onChange: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function subscribeDismissed(onChange: () => void) {
  window.addEventListener(DISMISS_EVENT, onChange);
  return () => window.removeEventListener(DISMISS_EVENT, onChange);
}

export function InstallBanner() {
  const standalone = useSyncExternalStore(
    subscribeStandalone,
    isStandalone,
    () => true,
  );
  const dismissed = useSyncExternalStore(
    subscribeDismissed,
    isDismissed,
    () => true,
  );
  const [guideOpen, setGuideOpen] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    function onPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (standalone || dismissed) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    window.dispatchEvent(new Event(DISMISS_EVENT));
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    setInstallEvent(null);
    dismiss();
  }

  const canPrompt = Boolean(installEvent);

  return (
    <>
      <div className="rounded-16 bg-accent-soft px-4 py-3 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <p className="text-15 text-ink">홈 화면에 추가하면 앱처럼 열 수 있어요.</p>
          <GhostButton
            onClick={dismiss}
            className="h-auto w-auto px-0 text-13 text-muted"
          >
            닫기
          </GhostButton>
        </div>
        <PrimaryButton
          className="mt-3"
          onClick={() => {
            if (canPrompt) void install();
            else setGuideOpen(true);
          }}
        >
          {canPrompt ? "홈 화면에 추가" : "설치 방법 보기"}
        </PrimaryButton>
      </div>
      <InstallGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}
