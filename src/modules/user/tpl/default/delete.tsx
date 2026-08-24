"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, ShieldAlert, Trash2 } from "lucide-react";

import Alert from "@components/message/Alert";
import Button from "@components/button/Button";
import InputField from "@components/form/InputField";
import HeaderUser from "@/modules/user/tpl/default/header";
import { removeMyAccount, verifyMyPassword } from "@/modules/user/actions/user.action";
import { UserInfo } from "@/modules/user/actions/_type";

type Props = {
  initialUser: UserInfo;
};

const UserDelete = ({ initialUser }: Props) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: async (password: string) => await verifyMyPassword(password),
    onSuccess: (res) => {
      if (!res.success) {
        setIsVerified(false);
        setMessage({ type: res.type || "error", text: res.message });
        formRef.current?.querySelector<HTMLInputElement>('input[name="password"]')?.focus();
        return;
      }

      setIsVerified(true);
      setMessage({ type: "success", text: res.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (formData: FormData) => await removeMyAccount(formData),
    onSuccess: (res) => {
      if (!res.success) {
        setMessage({ type: res.type || "error", text: res.message });
        return;
      }
      queryClient.clear();
      router.replace("/");
    },
    onError: () => setMessage({ type: "error", text: "서버 오류가 발생했습니다." }),
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") || "");

    if (!password.trim()) {
      setMessage({ type: "error", text: "비밀번호를 입력해주세요." });
      formRef.current?.querySelector<HTMLInputElement>('input[name="password"]')?.focus();
      return;
    }

    if (!isVerified) {
      verifyMutation.mutate(password);
      return;
    }

    if (window.confirm("정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      deleteMutation.mutate(formData);
    }
  };

  return (
    <>
      <HeaderUser />
      <div className="min-h-screen bg-white dark:bg-dark-950">
        <div className="mx-auto max-w-screen-lg px-4 py-10 md:py-14">
          <form ref={formRef} onSubmit={handleSubmit} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-dark-800 dark:bg-dark-900 md:p-8">
            <div className="border-b border-gray-200 pb-6 dark:border-dark-800">
              <div className="text-xs uppercase tracking-[0.18em] text-gray-400 dark:text-dark-500">Account removal</div>
              <h1 className="mt-3 text-3xl font-medium tracking-[-0.045em] text-gray-950 dark:text-dark-100">회원 탈퇴</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-dark-400">
                {initialUser.nickName} 계정을 삭제하기 전에 비밀번호를 확인합니다. 탈퇴 후 계정 정보는 복구할 수 없습니다.
              </p>
            </div>

            {message && (
              <div className="mt-5">
                <Alert message={message.text} type={message.type} />
              </div>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-dark-800 dark:bg-dark-950/40">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-950 dark:text-dark-100">
                  <ShieldAlert size={17} />
                  삭제 안내
                </div>
                <p className="text-sm leading-6 text-gray-500 dark:text-dark-400">
                  계정, 프로필, 개인 설정이 삭제됩니다. 공개 콘텐츠와 법적 보관이 필요한 기록은 정책에 따라 남을 수 있습니다.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-dark-800 dark:bg-dark-950/40">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-950 dark:text-dark-100">
                  <KeyRound size={17} />
                  본인 확인
                </div>
                <InputField
                  inputTitle="현재 비밀번호"
                  type="password"
                  name="password"
                  placeholder="비밀번호"
                  onChange={() => {
                    if (isVerified) {
                      setIsVerified(false);
                      setMessage(null);
                    }
                  }}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" onClick={() => router.back()}>
                취소
              </Button>
              <Button
                type="submit"
                isLoading={verifyMutation.isPending || deleteMutation.isPending}
                icon={isVerified ? <Trash2 size={15} /> : <KeyRound size={15} />}
                className={isVerified ? "!border-red-200 !text-red-500 hover:!border-red-300 hover:!bg-red-50" : ""}
              >
                {isVerified ? "탈퇴하기" : "비밀번호 확인"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UserDelete;
