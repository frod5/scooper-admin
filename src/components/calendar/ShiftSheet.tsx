"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { GhostButton } from "@/components/ui/GhostButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import {
  DEFAULT_END,
  DEFAULT_START,
  defaultShiftTime,
  shortDayLabel,
  timeToMinutes,
} from "@/lib/datetime";
import type { AssignableEmployee, Branch, WorkAssignment } from "@/lib/types";

export function ShiftSheet({
  open,
  date,
  branchName,
  branches,
  requireBranch,
  assignment,
  assignable,
  onBranchChange,
  onRangeChange,
  onClose,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  date: string;
  branchName?: string;
  branches?: Branch[];
  requireBranch?: boolean;
  assignment: WorkAssignment | null;
  assignable: AssignableEmployee[];
  onBranchChange?: (branchId: string) => void;
  onRangeChange?: (fromDate: string, toDate: string) => void;
  onClose: () => void;
  onCreate: (
    userId: string,
    start: string,
    end: string,
    fromDate: string,
    toDate: string,
  ) => Promise<string | null>;
  onUpdate: (
    id: string,
    start: string,
    end: string,
    userId: string,
  ) => Promise<string | null>;
}) {
  const editing = Boolean(assignment);
  const resigned = assignment?.status === "resigned";
  const [userId, setUserId] = useState(assignment?.user_id ?? "");
  const [branchId, setBranchId] = useState("");
  const [fromDate, setFromDate] = useState(date);
  const [toDate, setToDate] = useState(date);
  const [start, setStart] = useState(
    defaultShiftTime(assignment?.start_time, DEFAULT_START, "09:00"),
  );
  const [end, setEnd] = useState(
    defaultShiftTime(assignment?.end_time, DEFAULT_END, "18:00"),
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const rangeLabel =
    fromDate === toDate
      ? shortDayLabel(fromDate)
      : `${shortDayLabel(fromDate <= toDate ? fromDate : toDate)}–${shortDayLabel(fromDate <= toDate ? toDate : fromDate)}`;

  function changeFrom(value: string) {
    setFromDate(value);
    setError("");
    onRangeChange?.(value, toDate);
  }

  function changeTo(value: string) {
    setToDate(value);
    setError("");
    onRangeChange?.(fromDate, value);
  }

  async function save() {
    if (timeToMinutes(end) <= timeToMinutes(start)) {
      setError("종료 시간은 시작 이후여야 합니다.");
      return;
    }
    if (!editing && requireBranch && !branchId) {
      setError("지점을 선택하세요.");
      return;
    }
    if (!userId) {
      setError("직원을 선택하세요.");
      return;
    }
    setLoading(true);
    const message = editing
      ? await onUpdate(assignment!.id, start, end, userId)
      : await onCreate(userId, start, end, fromDate, toDate);
    setLoading(false);
    if (message) {
      setError(message);
      return;
    }
    onClose();
  }

  return (
    <Dialog
      open={open}
      title={
        editing
          ? `근무 수정 · ${shortDayLabel(date)}`
          : `근무 추가 · ${rangeLabel}`
      }
      onClose={onClose}
    >
        <div className="flex flex-col gap-4">
          {branchName ? (
            <p className="text-13 text-muted">{branchName}</p>
          ) : null}
          {requireBranch && !editing ? (
            <SelectField
              label="지점"
              value={branchId}
              onChange={(value) => {
                setBranchId(value);
                setUserId("");
                onBranchChange?.(value);
              }}
              options={(branches ?? []).map((branch) => ({
                value: branch.id,
                label: branch.name,
              }))}
            />
          ) : null}
          {editing ? null : (
            <>
              <TextField
                label="시작 날짜"
                type="date"
                value={fromDate}
                onChange={changeFrom}
              />
              <TextField
                label="종료 날짜"
                type="date"
                value={toDate}
                onChange={changeTo}
              />
            </>
          )}
          <SelectField
            label="직원"
            value={userId}
            onChange={(value) => {
              setUserId(value);
              setError("");
            }}
            options={assignable.map((person) => ({
              value: person.id,
              label: person.name,
            }))}
            disabled={assignable.length === 0}
          />
          <TextField
            label="시작 시간"
            type="time"
            value={start}
            onChange={(value) => {
              setStart(value);
              setError("");
            }}
            disabled={resigned}
          />
          <TextField
            label="종료 시간"
            type="time"
            value={end}
            onChange={(value) => {
              setEnd(value);
              setError("");
            }}
            error={error}
            disabled={resigned}
          />
          <div className="flex gap-3">
            <GhostButton onClick={onClose}>취소</GhostButton>
            {resigned ? null : (
              <PrimaryButton loading={loading} onClick={() => void save()}>
                저장
              </PrimaryButton>
            )}
          </div>
        </div>
    </Dialog>
  );
}
