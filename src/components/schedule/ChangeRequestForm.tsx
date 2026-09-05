"use client";

import { useId, useState } from "react";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { GhostButton } from "@/components/ui/GhostButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { createChangeRequestAction } from "@/lib/schedules/actions";
import {
  DEFAULT_END,
  DEFAULT_START,
  formatTime,
  formatTimeRange,
  requestedDateBlockReason,
  shortDayLabel,
  timeToMinutes,
  todayISO,
} from "@/lib/datetime";

export function ChangeRequestForm({
  date,
  currentStart,
  currentEnd,
  onCancel,
  onSubmitted,
}: {
  date: string;
  currentStart?: string | null;
  currentEnd?: string | null;
  onCancel: () => void;
  onSubmitted: () => void;
}) {
  const startId = useId();
  const reasonId = useId();
  const currentStartTime = formatTime(currentStart || DEFAULT_START);
  const currentEndTime = formatTime(currentEnd || DEFAULT_END);
  const minDate = todayISO();
  const [requestedDate, setRequestedDate] = useState(date);
  const [start, setStart] = useState(DEFAULT_START);
  const [end, setEnd] = useState(DEFAULT_END);
  const [reason, setReason] = useState("");
  const [dateError, setDateError] = useState("");
  const [startError, setStartError] = useState("");
  const [endError, setEndError] = useState("");
  const [banner, setBanner] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    let nextDateError = "";
    let nextEndError = "";
    let nextStartError = "";
    if (timeToMinutes(end) <= timeToMinutes(start)) {
      nextEndError = "종료 시간은 시작 이후여야 합니다.";
    }
    if (!requestedDate) {
      nextDateError = "날짜를 선택하세요.";
    } else {
      const targetBlocked = requestedDateBlockReason(requestedDate, start);
      if (targetBlocked) nextDateError = targetBlocked;
    }
    if (
      !nextDateError &&
      !nextEndError &&
      requestedDate === date &&
      start === currentStartTime &&
      end === currentEndTime
    ) {
      nextStartError = "변경 내용이 없습니다.";
    }
    setDateError(nextDateError);
    setStartError(nextStartError);
    setEndError(nextEndError);
    setBanner("");
    if (nextDateError || nextStartError || nextEndError) return;

    setLoading(true);
    const result = await createChangeRequestAction({
      workDate: date,
      requestedDate,
      requestedStart: start,
      requestedEnd: end,
      reason,
    });
    setLoading(false);
    if (!result.ok) {
      if (result.error === "종료 시간은 시작 이후여야 합니다.") {
        setEndError(result.error);
      } else if (
        result.error === "변경 내용이 없습니다." ||
        result.error === "시간이 같으면 요청할 수 없습니다."
      ) {
        setStartError("변경 내용이 없습니다.");
      } else if (
        result.error === "지난 날짜로는 변경할 수 없습니다." ||
        result.error === "이미 지난 시간으로는 변경할 수 없습니다."
      ) {
        setDateError(result.error);
      } else {
        setBanner(result.error);
      }
      return;
    }
    onSubmitted();
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-13 text-muted">
        현재 {shortDayLabel(date)} {formatTimeRange(currentStartTime, currentEndTime)}
      </p>
      {banner ? <ErrorBanner message={banner} /> : null}
      <TextField
        label="날짜"
        type="date"
        min={minDate}
        value={requestedDate}
        onChange={(value) => {
          setRequestedDate(value);
          setDateError("");
          setStartError("");
        }}
        error={dateError}
        disabled={loading}
      />
      <TextField
        id={startId}
        label="시작 시간"
        type="time"
        value={start}
        onChange={(value) => {
          setStart(value);
          setStartError("");
          setEndError("");
          setDateError("");
        }}
        error={startError}
        disabled={loading}
      />
      <TextField
        label="종료 시간"
        type="time"
        value={end}
        onChange={(value) => {
          setEnd(value);
          setStartError("");
          setEndError("");
        }}
        error={endError}
        disabled={loading}
      />
      <div>
        <label htmlFor={reasonId} className="mb-1 block text-13 text-muted">
          사유 (선택)
        </label>
        <textarea
          id={reasonId}
          rows={3}
          value={reason}
          disabled={loading}
          onChange={(event) => setReason(event.target.value)}
          className="w-full rounded-12 bg-surface-2 px-3 py-2 text-15 text-ink outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
        />
      </div>
      <div className="flex gap-3">
        <GhostButton onClick={onCancel} disabled={loading}>
          취소
        </GhostButton>
        <PrimaryButton onClick={() => void onSubmit()} loading={loading}>
          요청 보내기
        </PrimaryButton>
      </div>
    </div>
  );
}
