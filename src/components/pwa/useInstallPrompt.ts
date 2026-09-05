"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const AVAILABLE_EVENT = "scooper-install-available";
const INSTALLED_EVENT = "scooper-pwa-installed";
const INSTALLED_KEY = "scooper.pwa.installed";

let deferredPrompt: InstallPromptEvent | null = null;

function capturePrompt(event: Event) {
  event.preventDefault();
  deferredPrompt = event as InstallPromptEvent;
  window.dispatchEvent(new Event(AVAILABLE_EVENT));
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", capturePrompt);
  window.addEventListener("appinstalled", () => {
    markInstalled();
  });
}

function isStandalone() {
  const display = window.matchMedia;
  return (
    display("(display-mode: standalone)").matches ||
    display("(display-mode: fullscreen)").matches ||
    display("(display-mode: minimal-ui)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone) ||
    document.referrer.startsWith("android-app://")
  );
}

function isIos() {
  const ua = navigator.userAgent;
  const iPhone = /iPhone|iPad|iPod/i.test(ua);
  const iPadOs =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iPhone || iPadOs;
}

function wasMarkedInstalled() {
  try {
    return localStorage.getItem(INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}

function markInstalled() {
  try {
    localStorage.setItem(INSTALLED_KEY, "1");
  } catch {
    // ignore
  }
  deferredPrompt = null;
  window.dispatchEvent(new Event(INSTALLED_EVENT));
}

async function relatedAppInstalled() {
  const nav = navigator as Navigator & {
    getInstalledRelatedApps?: () => Promise<unknown[]>;
  };
  if (!nav.getInstalledRelatedApps) return false;
  try {
    const apps = await nav.getInstalledRelatedApps();
    return apps.length > 0;
  } catch {
    return false;
  }
}

export function useInstallPrompt() {
  const [show, setShow] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let wait: number | undefined;

    async function decide() {
      if (isStandalone()) {
        markInstalled();
        if (!cancelled) setShow(false);
        return;
      }
      if (wasMarkedInstalled()) {
        if (!cancelled) setShow(false);
        return;
      }
      if (await relatedAppInstalled()) {
        markInstalled();
        if (!cancelled) setShow(false);
        return;
      }
      if (isIos()) {
        if (!cancelled) setShow(true);
        return;
      }
      if (deferredPrompt) {
        if (!cancelled) setShow(true);
        return;
      }
      wait = window.setTimeout(() => {
        if (cancelled) return;
        setShow(Boolean(deferredPrompt) && !wasMarkedInstalled());
      }, 2000);
    }

    function onAvailable() {
      if (cancelled || wasMarkedInstalled() || isStandalone()) return;
      setShow(true);
    }

    function onInstalled() {
      if (!cancelled) setShow(false);
    }

    void decide();
    window.addEventListener(AVAILABLE_EVENT, onAvailable);
    window.addEventListener(INSTALLED_EVENT, onInstalled);
    window.addEventListener("appinstalled", onInstalled);
    const media = window.matchMedia("(display-mode: standalone)");
    media.addEventListener("change", onInstalled);

    return () => {
      cancelled = true;
      if (wait) window.clearTimeout(wait);
      window.removeEventListener(AVAILABLE_EVENT, onAvailable);
      window.removeEventListener(INSTALLED_EVENT, onInstalled);
      window.removeEventListener("appinstalled", onInstalled);
      media.removeEventListener("change", onInstalled);
    };
  }, []);

  async function addToHome() {
    if (deferredPrompt) {
      const promptEvent = deferredPrompt;
      deferredPrompt = null;
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === "accepted") {
        markInstalled();
        setShow(false);
      }
      return;
    }
    setGuideOpen(true);
  }

  return {
    show,
    guideOpen,
    setGuideOpen,
    addToHome,
  };
}
