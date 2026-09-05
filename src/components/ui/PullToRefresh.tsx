"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Spinner } from "@/components/ui/Spinner";

const THRESHOLD = 56;
const MAX = 88;

export function PullToRefresh({ children }: { children: ReactNode }) {
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const offsetRef = useRef(0);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    function blocked() {
      if (refreshing) return true;
      return Boolean(document.querySelector('[role="dialog"]'));
    }

    function onStart(event: TouchEvent) {
      if (blocked() || window.scrollY > 0) return;
      startY.current = event.touches[0].clientY;
      pulling.current = true;
    }

    function onMove(event: TouchEvent) {
      if (!pulling.current || blocked()) return;
      const dy = event.touches[0].clientY - startY.current;
      if (window.scrollY > 0 || dy <= 0) {
        if (offsetRef.current !== 0) setOffset(0);
        if (dy <= 0) pulling.current = false;
        return;
      }
      const next = Math.min(MAX, dy * 0.45);
      setOffset(next);
      if (next > 8) event.preventDefault();
    }

    function onEnd() {
      if (!pulling.current) return;
      pulling.current = false;
      if (offsetRef.current >= THRESHOLD) {
        setRefreshing(true);
        setOffset(THRESHOLD);
        window.location.reload();
        return;
      }
      setOffset(0);
    }

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [refreshing]);

  const height = refreshing ? THRESHOLD : offset;

  return (
    <div>
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{ height }}
        aria-hidden
      >
        {height > 12 ? <Spinner /> : null}
      </div>
      {children}
    </div>
  );
}
