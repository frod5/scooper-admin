"use client";

import { useState, type FormEvent } from "react";
import { AppHeader } from "@/components/ui/AppHeader";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { PasswordField } from "@/components/ui/PasswordField";
import { PhoneField } from "@/components/ui/PhoneField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { loginAction } from "@/lib/auth/actions";
import { isValidPhone } from "@/lib/phone";

export function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [banner, setBanner] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBanner("");

    const nextPhoneError = isValidPhone(phone) ? "" : "전화번호를 확인하세요";
    const nextPasswordError = password ? "" : "비밀번호를 입력하세요";
    setPhoneError(nextPhoneError);
    setPasswordError(nextPasswordError);
    if (nextPhoneError || nextPasswordError) return;

    setLoading(true);
    const result = await loginAction(phone, password);
    if (result && !result.ok) {
      setBanner(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg">
      <div className="mx-auto w-full max-w-[520px] bg-bg">
        <AppHeader title="SCOOPER" />
        <div className="px-4 pt-6">
          {banner ? (
            <div className="mb-6">
              <ErrorBanner message={banner} />
            </div>
          ) : null}

          <form className="flex flex-col gap-5" onSubmit={onSubmit}>
            <PhoneField
              label="전화번호"
              value={phone}
              onChange={(value) => {
                setPhone(value);
                setPhoneError("");
              }}
              error={phoneError}
              disabled={loading}
              autoComplete="tel"
              placeholder=""
            />
            <PasswordField
              label="비밀번호"
              value={password}
              onChange={(value) => {
                setPassword(value);
                setPasswordError("");
              }}
              error={passwordError}
              disabled={loading}
              autoComplete="current-password"
            />
            <PrimaryButton type="submit" loading={loading} disabled={loading}>
              로그인
            </PrimaryButton>
          </form>
        </div>
      </div>
    </div>
  );
}
