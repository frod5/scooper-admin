"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { EventChip } from "@/components/calendar/EventChip";
import { displayName } from "@/lib/schedules/view";
import type { WorkAssignment } from "@/lib/types";

const LONG_PRESS_MS = 220;
const CANCEL_PX = 12;

type DragState = {
  assignment: WorkAssignment;
  x: number;
  y: number;
  overDate: string | null;
};

type ShiftDndContextValue = {
  draggingId: string | null;
  overDate: string | null;
  bindDrag: (assignment: WorkAssignment) => {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  };
};

const ShiftDndContext = createContext<ShiftDndContextValue | null>(null);

function dateFromPoint(x: number, y: number) {
  const node = document.elementFromPoint(x, y);
  if (!node) return null;
  const host = node.closest("[data-drop-date]");
  return host?.getAttribute("data-drop-date") ?? null;
}

export function ShiftDndProvider({
  myUserId,
  onDrop,
  children,
}: {
  myUserId?: string;
  onDrop: (assignment: WorkAssignment, date: string) => void;
  children: ReactNode;
}) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const pendingRef = useRef<{
    assignment: WorkAssignment;
    pointerId: number;
    startX: number;
    startY: number;
    timer: number;
  } | null>(null);

  const clearPending = useCallback(() => {
    const pending = pendingRef.current;
    if (pending) {
      window.clearTimeout(pending.timer);
      pendingRef.current = null;
    }
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setDrag(null);
    document.body.style.overflow = "";
  }, []);

  const startDrag = useCallback(
    (assignment: WorkAssignment, x: number, y: number) => {
      const next = {
        assignment,
        x,
        y,
        overDate: dateFromPoint(x, y),
      };
      dragRef.current = next;
      setDrag(next);
      document.body.style.overflow = "hidden";
    },
    [],
  );

  useEffect(() => {
    function onMove(event: PointerEvent) {
      const pending = pendingRef.current;
      if (pending && !dragRef.current) {
        const dx = event.clientX - pending.startX;
        const dy = event.clientY - pending.startY;
        if (Math.hypot(dx, dy) > CANCEL_PX) clearPending();
        return;
      }
      if (!dragRef.current) return;
      event.preventDefault();
      const next = {
        ...dragRef.current,
        x: event.clientX,
        y: event.clientY,
        overDate: dateFromPoint(event.clientX, event.clientY),
      };
      dragRef.current = next;
      setDrag(next);
    }

    function onUp(event: PointerEvent) {
      const pending = pendingRef.current;
      clearPending();
      const current = dragRef.current;
      if (!current) return;
      const date = dateFromPoint(event.clientX, event.clientY);
      const assignment = current.assignment;
      endDrag();
      if (date && date !== assignment.work_date) {
        onDrop(assignment, date);
      }
    }

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [clearPending, endDrag, onDrop]);

  const bindDrag = useCallback(
    (assignment: WorkAssignment) => ({
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
        if (event.button !== 0) return;
        clearPending();
        const timer = window.setTimeout(() => {
          pendingRef.current = null;
          startDrag(assignment, event.clientX, event.clientY);
        }, LONG_PRESS_MS);
        pendingRef.current = {
          assignment,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          timer,
        };
      },
    }),
    [clearPending, startDrag],
  );

  return (
    <ShiftDndContext.Provider
      value={{
        draggingId: drag?.assignment.id ?? null,
        overDate: drag?.overDate ?? null,
        bindDrag,
      }}
    >
      {children}
      {drag ? (
        <div
          className="pointer-events-none fixed z-[60] -translate-x-1/2 -translate-y-1/2 rounded-12 bg-surface px-2 py-1 shadow-sheet"
          style={{ left: drag.x, top: drag.y }}
        >
          <EventChip
            name={displayName(drag.assignment, myUserId)}
            userId={drag.assignment.user_id}
            mine={Boolean(myUserId && drag.assignment.user_id === myUserId)}
          />
        </div>
      ) : null}
    </ShiftDndContext.Provider>
  );
}

export function useShiftDnd() {
  const ctx = useContext(ShiftDndContext);
  return (
    ctx ?? {
      draggingId: null,
      overDate: null,
      bindDrag: () => ({ onPointerDown: () => undefined }),
    }
  );
}
