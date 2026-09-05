"use client";

import { useState } from "react";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { PasswordField } from "@/components/ui/PasswordField";
import { PhoneField } from "@/components/ui/PhoneField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TextField } from "@/components/ui/TextField";
import { NoticeToast } from "@/components/ui/NoticeToast";
import { updateMyProfileAction } from "@/lib/profile/actions";
import { isValidPhone } from "@/lib/phone";
import { roleLabel } from "@/lib/roles";
import type { Profile } from "@/lib/types";

export function EmployeeProfileForm({
  profile,
  showBranch = true,
}: {
  profile: Profile;
  showBranch?: boolean;
}) {
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [banner, setBanner] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  async function onSubmit() {
    const nextNameError = name.trim() ? "" : "이름을 입력하세요.";
    const nextPhoneError = isValidPhone(phone) ? "" : "전화번호를 확인하세요";
    const passwordTouched = Boolean(currentPassword || newPassword);
    const nextPasswordError = passwordTouched
      ? !currentPassword || !newPassword
        ? "현재 비밀번호와 새 비밀번호를 모두 입력하세요."
        : newPassword.length < 6
          ? "비밀번호는 최소 6자리입니다."
          : ""
      : "";
    setNameError(nextNameError);
    setPhoneError(nextPhoneError);
    setPasswordError(nextPasswordError);
    setBanner("");
    if (nextNameError || nextPhoneError || nextPasswordError) return;

    setLoading(true);
    const result = await updateMyProfileAction({
      name,
      phone,
      currentPassword,
      newPassword,
    });
    setLoading(false);
    if (!result.ok) {
      if (result.error === "이미 사용 중인 전화번호입니다.") {
        setPhoneError(result.error);
      } else if (result.error === "현재 비밀번호가 올바르지 않습니다.") {
        setPasswordError(result.error);
      } else if (
        result.error === "현재 비밀번호와 새 비밀번호를 모두 입력하세요." ||
        result.error === "비밀번호는 최소 6자리입니다."
      ) {
        setPasswordError(result.error);
      } else if (result.error === "이름을 입력하세요.") {
        setNameError(result.error);
      } else {
        setBanner(result.error);
      }
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setToast("저장했습니다.");
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      {banner ? <ErrorBanner message={banner} /> : null}
      <div className="flex flex-col gap-5 rounded-16 bg-surface p-4 shadow-card">
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
        {showBranch ? (
          <div>
            <p className="mb-1 text-13 text-muted">지점</p>
            <p className="text-15 text-ink">{profile.branch_name ?? ""}</p>
          </div>
        ) : (
          <div>
            <p className="mb-1 text-13 text-muted">역할</p>
            <p className="text-15 text-ink">{roleLabel(profile.role)}</p>
          </div>
        )}
        <div>
          <p className="mb-1 text-13 text-muted">상태</p>
          <StatusBadge
            variant={profile.status === "active" ? "active" : "resigned"}
          />
        </div>
      </div>
      <div className="flex flex-col gap-5 rounded-16 bg-surface p-4 shadow-card">
        <p className="text-17 font-bold text-ink">비밀번호 변경</p>
        <PasswordField
          label="현재 비밀번호"
          value={currentPassword}
          onChange={(value) => {
            setCurrentPassword(value);
            setPasswordError("");
          }}
          error={passwordError}
          disabled={loading}
          autoComplete="current-password"
        />
        <PasswordField
          label="새 비밀번호"
          value={newPassword}
          onChange={(value) => {
            setNewPassword(value);
            setPasswordError("");
          }}
          disabled={loading}
          autoComplete="new-password"
          placeholder="최소 6자리"
        />
        <PrimaryButton type="submit" loading={loading}>
          저장
        </PrimaryButton>
      </div>
      {toast ? (
        <NoticeToast message={toast} variant="ok" onDone={() => setToast("")} />
      ) : null}
    </form>
  );
}
