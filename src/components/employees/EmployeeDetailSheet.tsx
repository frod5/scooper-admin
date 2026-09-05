"use client";

import { useState } from "react";
import { ResponsiveSheet } from "@/components/ui/BottomSheet";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DangerButton } from "@/components/ui/DangerButton";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { GhostButton } from "@/components/ui/GhostButton";
import { PhoneField } from "@/components/ui/PhoneField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { SelectField } from "@/components/ui/SelectField";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TextField } from "@/components/ui/TextField";
import {
  resetPasswordToInitialAction,
  setEmployeeStatusAction,
  updateEmployeeAction,
} from "@/lib/employees/actions";
import { isValidPhone } from "@/lib/phone";
import type { Branch, DirectoryPerson } from "@/lib/types";

export function EmployeeDetailSheet({
  open,
  person,
  branches,
  canResetPassword,
  onClose,
  onSaved,
}: {
  open: boolean;
  person: DirectoryPerson;
  branches: Branch[];
  canResetPassword?: boolean;
  onClose: () => void;
  onSaved: (person: DirectoryPerson, toast?: string) => void;
}) {
  const [name, setName] = useState(person.name);
  const [phone, setPhone] = useState(person.phone);
  const [branchId, setBranchId] = useState(person.branch_id ?? "");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [branchError, setBranchError] = useState("");
  const [banner, setBanner] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmResign, setConfirmResign] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const isEmployee = person.role === "employee";
  const selected = person;

  async function onSave() {
    const nextNameError = name.trim() ? "" : "이름을 입력하세요.";
    const nextPhoneError = isValidPhone(phone) ? "" : "전화번호를 확인하세요";
    const nextBranchError =
      isEmployee && !branchId ? "지점을 선택하세요." : "";
    setNameError(nextNameError);
    setPhoneError(nextPhoneError);
    setBranchError(nextBranchError);
    setBanner("");
    if (nextNameError || nextPhoneError || nextBranchError) return;

    setLoading(true);
    const result = await updateEmployeeAction({
      id: selected.id,
      name,
      phone,
      branchId: isEmployee ? branchId : null,
    });
    setLoading(false);
    if (!result.ok) {
      if (result.error === "이미 등록된 전화번호입니다.") {
        setPhoneError(result.error);
      } else {
        setBanner(result.error);
      }
      return;
    }
    onSaved(result.data);
  }

  async function onSetStatus(status: "active" | "resigned") {
    setLoading(true);
    const result = await setEmployeeStatusAction({ id: selected.id, status });
    setLoading(false);
    setConfirmResign(false);
    if (!result.ok) {
      setBanner(result.error);
      return;
    }
    onSaved(result.data);
  }

  async function onResetPassword() {
    setLoading(true);
    const result = await resetPasswordToInitialAction(selected.id);
    setLoading(false);
    setConfirmReset(false);
    if (!result.ok) {
      setBanner(result.error);
      return;
    }
    onSaved(selected, "비밀번호를 123456으로 바꿨습니다.");
  }

  return (
    <>
      <ResponsiveSheet open={open} title={person.name} onClose={onClose}>
        <div className="flex flex-col gap-5">
          {banner ? <ErrorBanner message={banner} /> : null}
          <TextField
            label="이름"
            value={name}
            onChange={(value) => {
              setName(value);
              setNameError("");
            }}
            error={nameError}
            disabled={loading}
          />
          <PhoneField
            label="전화번호"
            value={phone}
            onChange={(value) => {
              setPhone(value);
              setPhoneError("");
            }}
            error={phoneError}
            disabled={loading}
          />
          {isEmployee ? (
            <SelectField
              label="지점"
              value={branchId}
              onChange={(value) => {
                setBranchId(value);
                setBranchError("");
              }}
              options={branches.map((branch) => ({
                value: branch.id,
                label: branch.name,
              }))}
              error={branchError}
              disabled={loading}
            />
          ) : (
            <div>
              <p className="mb-1 text-13 text-muted">역할</p>
              <p className="text-15 text-ink">대표</p>
            </div>
          )}
          {isEmployee ? (
            <div>
              <p className="mb-1 text-13 text-muted">상태</p>
              <StatusBadge
                variant={person.status === "active" ? "active" : "resigned"}
              />
            </div>
          ) : null}
          {canResetPassword ? (
            <SecondaryButton
              onClick={() => setConfirmReset(true)}
              disabled={loading}
            >
              비밀번호 초기화
            </SecondaryButton>
          ) : (
            <p className="text-13 text-muted">
              비밀번호는 설정에서 바꿀 수 있습니다.
            </p>
          )}
          <PrimaryButton onClick={() => void onSave()} loading={loading}>
            저장
          </PrimaryButton>
          {isEmployee && person.status === "active" ? (
            <DangerButton
              onClick={() => setConfirmResign(true)}
              disabled={loading}
            >
              퇴사 처리
            </DangerButton>
          ) : null}
          {isEmployee && person.status === "resigned" ? (
            <SecondaryButton
              onClick={() => void onSetStatus("active")}
              loading={loading}
            >
              근무중으로 복구
            </SecondaryButton>
          ) : null}
          <GhostButton onClick={onClose}>닫기</GhostButton>
        </div>
      </ResponsiveSheet>
      <ConfirmDialog
        open={confirmResign}
        title="퇴사 처리"
        body="퇴사 처리하면 로그인할 수 없고 일정·공지 대상에서 빠집니다. 목록에는 남습니다."
        confirmLabel="퇴사 처리"
        danger
        onClose={() => setConfirmResign(false)}
        onConfirm={() => {
          void onSetStatus("resigned");
        }}
      />
      <ConfirmDialog
        open={confirmReset}
        title="비밀번호 초기화"
        body="비밀번호를 123456으로 바꿀까요?"
        confirmLabel="초기화"
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          void onResetPassword();
        }}
      />
    </>
  );
}
