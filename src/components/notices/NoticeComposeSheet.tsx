"use client";

import { useId, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { FilterChips } from "@/components/ui/FilterChips";
import { GhostButton } from "@/components/ui/GhostButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { RadioRow } from "@/components/ui/RadioRow";
import { TextField } from "@/components/ui/TextField";
import { createNoticeAction } from "@/lib/notices/actions";
import type { Branch } from "@/lib/types";

export function NoticeComposeSheet({
  open,
  branches,
  onClose,
  onSent,
}: {
  open: boolean;
  branches: Branch[];
  onClose: () => void;
  onSent: (message: string) => void;
}) {
  const bodyId = useId();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<"all" | "branch">("all");
  const [branchId, setBranchId] = useState("");
  const [titleError, setTitleError] = useState("");
  const [bodyError, setBodyError] = useState("");
  const [branchError, setBranchError] = useState("");
  const [banner, setBanner] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selectedBranch = branches.find((item) => item.id === branchId);
  const confirmCopy =
    target === "all"
      ? "전체 근무 중 직원에게 푸시를 보낼까요?"
      : `${selectedBranch?.name ?? ""} 근무 중 직원에게 푸시를 보낼까요?`;

  function validate() {
    const nextTitle = title.trim() ? "" : "제목을 입력하세요.";
    const nextBody = body.trim() ? "" : "내용을 입력하세요.";
    const nextBranch =
      target === "branch" && !branchId ? "지점을 선택하세요." : "";
    setTitleError(nextTitle);
    setBodyError(nextBody);
    setBranchError(nextBranch);
    setBanner("");
    return !nextTitle && !nextBody && !nextBranch;
  }

  async function send() {
    setConfirmOpen(false);
    setLoading(true);
    const result = await createNoticeAction({
      title,
      body,
      branchId: target === "branch" ? branchId : null,
    });
    setLoading(false);
    if (!result.ok) {
      if (result.error === "제목을 입력하세요.") setTitleError(result.error);
      else if (result.error === "내용을 입력하세요.") setBodyError(result.error);
      else setBanner(result.error);
      return;
    }
    setTitle("");
    setBody("");
    setTarget("all");
    setBranchId("");
    onClose();
    onSent(
      result.pushFailed
        ? "공지는 저장됐지만 푸시에 실패했습니다."
        : "공지를 보냈습니다.",
    );
  }

  return (
    <>
      <Dialog open={open} title="공지 보내기" onClose={onClose}>
        {banner ? (
          <div className="mb-3">
            <ErrorBanner message={banner} />
          </div>
        ) : null}
        <div className="flex flex-col gap-5">
          <TextField
            label="제목"
            value={title}
            onChange={(value) => {
              setTitle(value);
              setTitleError("");
            }}
            error={titleError}
            disabled={loading}
          />
          <div>
            <label htmlFor={bodyId} className="mb-1 block text-13 text-muted">
              내용
            </label>
            <textarea
              id={bodyId}
              rows={6}
              value={body}
              disabled={loading}
              onChange={(event) => {
                setBody(event.target.value);
                setBodyError("");
              }}
              className="w-full rounded-12 bg-surface-2 px-3 py-2 text-15 text-ink outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
            />
            {bodyError ? (
              <p className="mt-1 text-13 text-danger">{bodyError}</p>
            ) : null}
          </div>
          <div>
            <p className="mb-1 text-13 text-muted">보낼 곳</p>
            <RadioRow
              name="notice-target-sheet"
              value="all"
              checked={target === "all"}
              label="전체 직원"
              onChange={() => {
                setTarget("all");
                setBranchError("");
              }}
            />
            <RadioRow
              name="notice-target-sheet"
              value="branch"
              checked={target === "branch"}
              label="지점 선택"
              onChange={() => setTarget("branch")}
            >
              <FilterChips
                options={branches.map((branch) => ({
                  value: branch.id,
                  label: branch.name,
                }))}
                value={branchId}
                onChange={(value) => {
                  setBranchId(value);
                  setBranchError("");
                }}
              />
              {branchError ? (
                <p className="mt-1 text-13 text-danger">{branchError}</p>
              ) : null}
            </RadioRow>
            <p className="mt-2 text-13 text-muted">
              근무 중인 직원에게만 갑니다.
            </p>
          </div>
          <div className="flex gap-3">
            <GhostButton onClick={onClose} disabled={loading}>
              취소
            </GhostButton>
            <PrimaryButton
              loading={loading}
              onClick={() => {
                if (validate()) setConfirmOpen(true);
              }}
            >
              보내기
            </PrimaryButton>
          </div>
        </div>
      </Dialog>
      <Dialog
        open={confirmOpen}
        title="공지"
        onClose={() => setConfirmOpen(false)}
      >
        <p className="text-15 text-ink">{confirmCopy}</p>
        <div className="mt-6 flex gap-3">
          <GhostButton onClick={() => setConfirmOpen(false)}>취소</GhostButton>
          <PrimaryButton onClick={() => void send()}>확인</PrimaryButton>
        </div>
      </Dialog>
    </>
  );
}
