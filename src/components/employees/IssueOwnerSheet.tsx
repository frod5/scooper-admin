"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { GhostButton } from "@/components/ui/GhostButton";
import { PhoneField } from "@/components/ui/PhoneField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { issueOwnerAction } from "@/lib/employees/actions";
import { isValidPhone } from "@/lib/phone";
import type { DirectoryPerson } from "@/lib/types";

export function IssueOwnerSheet({
  open,
  onClose,
  onIssued,
}: {
  open: boolean;
  onClose: () => void;
  onIssued: (person: DirectoryPerson) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [banner, setBanner] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    const nextNameError = name.trim() ? "" : "이름을 입력하세요.";
    const nextPhoneError = isValidPhone(phone) ? "" : "전화번호를 확인하세요";
    setNameError(nextNameError);
    setPhoneError(nextPhoneError);
    setBanner("");
    if (nextNameError || nextPhoneError) return;

    setLoading(true);
    const result = await issueOwnerAction({ name, phone });
    setLoading(false);
    if (!result.ok) {
      if (result.error === "이미 등록된 전화번호입니다.") {
        setPhoneError(result.error);
      } else {
        setBanner(result.error);
      }
      return;
    }
    onIssued(result.data);
  }

  return (
    <Dialog open={open} title="대표 추가" onClose={onClose}>
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
          placeholder="010-"
        />
        <div className="rounded-12 bg-accent-soft p-3 text-13 text-ink">
          <p>초기 비밀번호는 123456입니다.</p>
          <p>직원에게 로그인 후 설정에서 바꾸라고 안내하세요.</p>
        </div>
        <div className="flex gap-3">
          <GhostButton onClick={onClose} disabled={loading}>
            취소
          </GhostButton>
          <PrimaryButton onClick={() => void onSubmit()} loading={loading}>
            추가
          </PrimaryButton>
        </div>
      </div>
    </Dialog>
  );
}
