"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { cn } from "@/lib/cn";
import { formatNoticeStamp } from "@/lib/datetime";
import {
  listMyNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/notifications/actions";
import type { AppNotification } from "@/lib/types";

export function NotificationsPage({
  initialItems,
  loadError,
}: {
  initialItems: AppNotification[];
  loadError?: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [banner, setBanner] = useState(loadError ?? "");
  const unreadCount = items.filter((item) => !item.read_at).length;

  async function retry() {
    const result = await listMyNotificationsAction();
    if (!result.ok) {
      setBanner(result.error);
      return;
    }
    setBanner("");
    setItems(result.data);
  }

  async function markAll() {
    const previous = items;
    setItems((current) =>
      current.map((item) =>
        item.read_at ? item : { ...item, read_at: new Date().toISOString() },
      ),
    );
    const result = await markAllNotificationsReadAction();
    if (!result.ok) {
      setItems(previous);
      setBanner(result.error);
      return;
    }
    router.refresh();
  }

  async function openItem(item: AppNotification) {
    if (!item.read_at) {
      setItems((current) =>
        current.map((row) =>
          row.id === item.id
            ? { ...row, read_at: new Date().toISOString() }
            : row,
        ),
      );
      const result = await markNotificationReadAction(item.id);
      if (!result.ok) {
        setBanner(result.error);
      }
    }
    router.push(item.url);
    router.refresh();
  }

  return (
    <div>
      {banner ? (
        <div className="mb-4">
          <ErrorBanner message={banner} onRetry={() => void retry()} />
        </div>
      ) : null}

      {!banner && unreadCount > 0 ? (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => void markAll()}
            className="text-15 font-semibold text-accent"
          >
            모두 읽음
          </button>
        </div>
      ) : null}

      {!banner && items.length === 0 ? (
        <EmptyState message="알림이 없습니다." />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const unread = !item.read_at;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => void openItem(item)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-[20px] px-5 py-3 text-left",
                  unread ? "bg-accent-soft" : "bg-surface",
                )}
              >
                <span
                  className={cn(
                    "mt-2 size-2 shrink-0 rounded-full",
                    unread ? "bg-accent" : "bg-transparent",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-17 text-ink">{item.title}</p>
                  {item.body ? (
                    <p className="mt-0.5 line-clamp-2 text-13 text-muted">
                      {item.body}
                    </p>
                  ) : null}
                  <p className="mt-1 text-13 text-muted">
                    {formatNoticeStamp(item.created_at)}
                  </p>
                </div>
                <ChevronRight
                  size={24}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0 text-muted"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
