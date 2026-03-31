"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import Alert from "@components/message/Alert";
import InputField from "@components/form/InputField";
import Button from "@components/button/Button";
import HeaderUser from "@modules/user/_tpl/default/header";

// 🌟 비밀번호 확인 액션과, 탈퇴 액션을 모두 불러옵니다.
import { removeMyAccount, verifyMyPassword } from "@modules/user/_actions/user.action";
import { UserInfo } from "@modules/user/_actions/_type";

type Props = {
  initialUser: UserInfo;
};

const UserDelete = ({ initialUser }: Props) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);

  const [error, setError] = useState<{ type: string; message: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 💡 핵심: 비밀번호가 서버에서 '인증 완료' 되었는지 추적하는 State
  const [isVerified, setIsVerified] = useState(false);

  // 1️⃣ [돌연변이 1] 비밀번호만 확인하는 기능
  const verifyMutation = useMutation({
    mutationFn: async (password: string) => await verifyMyPassword(password),
    onSuccess: (res) => {
      if (!res.success) {
        setIsVerified(false);
        setSuccessMsg(null);
        setError({ type: res.type || "error", message: res.message });
        const errorElement = formRef.current?.querySelector('input[name="password"]') as HTMLInputElement;
        if (errorElement) errorElement.focus();
        return;
      }

      // ✅ 비밀번호가 맞다면! 에러 끄고, 버튼 상태를 탈퇴 모드로 변신시킴
      setError(null);
      setSuccessMsg(res.message);
      setIsVerified(true);
    }
  });

  // 2️⃣ [돌연변이 2] 실제 계정 삭제 기능
  const deleteMutation = useMutation({
    mutationFn: async (formData: FormData) => await removeMyAccount(formData),
    onSuccess: (res) => {
      if (!res.success) {
        setError({ type: res.type || "error", message: res.message });
        return;
      }
      alert("회원 탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.");
      queryClient.clear();
      router.replace("/");
    },
    onError: () => setError({ type: "error", message: "서버 오류가 발생했습니다." })
  });

  // 🎯 폼 전송 핸들러 (버튼 하나로 두 가지 역할을 통제!)
  const handlerUserDeleteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    const pwd = formData.get("password") as string;

    if (!pwd.trim()) {
      setError({ type: "error", message: "비밀번호를 입력해주세요." });
      // 💡 빈칸일 때도 커서를 찌릿! 하고 이동시킵니다.
      const errorElement = formRef.current?.querySelector('input[name="password"]') as HTMLInputElement;
      if (errorElement) errorElement.focus();
      return;
    }

    if (!isVerified) {
      // 🔒 인증 안 됨 -> 비밀번호 검증 실행!
      verifyMutation.mutate(pwd);
    } else {
      // 🔓 인증 완료됨 -> 진짜 탈퇴 실행!
      if (window.confirm("정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
        deleteMutation.mutate(formData);
      }
    }
  };

  return (
    <>
      <HeaderUser />
      <div className="max-w-xl mx-auto px-4 py-16">
        <form ref={formRef} onSubmit={handlerUserDeleteSubmit}>

          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">회원 탈퇴</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              탈퇴 전 아래의 유의사항을 반드시 확인해 주시기 바랍니다.
            </p>
          </div>

          {/* 알림 메시지 영역 */}
          {error && <div className="mb-6"><Alert message={error.message} type={error.type} /></div>}
          {successMsg && <div className="mb-6"><Alert message={successMsg} type="success" /></div>}

          <div className="mb-8 bg-white dark:bg-dark-900">
            <div className="mb-7">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> 삭제되는 데이터
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 pl-3 border-l-2 border-gray-100 dark:border-dark-800 ml-1">
                <li>회원 정보 (이메일, 프로필, 비밀번호, 그룹정보 등) 일체</li>
                <li>웹사이트 내 이용 중인 서비스 설정 및 개인화 데이터</li>
              </ul>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> 보존되는 데이터
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 pl-3 border-l-2 border-gray-100 dark:border-dark-800 ml-1">
                <li>서비스 신청 및 결제 내역 (관련 법령에 의거하여 일정 기간 보관)</li>
                <li>1:1 문의 내역 및 고객센터 상담 기록</li>
                <li>작성한 게시글, 댓글 등 (작성자가 '알 수 없음'으로 처리됨)</li>
              </ul>
            </div>

            <hr className="border-gray-100 dark:border-dark-800 my-6" />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                본인 확인을 위해 현재 비밀번호를 입력해주세요.
              </label>
              {/* 💡 입력창에서 글자를 다시 수정하면 인증 상태가 풀리게 만듭니다! */}
              <InputField
                inputTitle=""
                type="password"
                name="password"
                placeholder="비밀번호 입력"
                onChange={() => {
                  if (isVerified) {
                    setIsVerified(false);
                    setSuccessMsg(null);
                  }
                }}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition dark:bg-dark-800 dark:text-gray-300 dark:hover:bg-dark-700 dark:hover:text-white"
            >
              취소
            </button>

            {/* 🌟 마법의 버튼! 인증 여부에 따라 디자인과 텍스트가 확 바뀝니다! */}
            <Button
              type="submit"
              isLoading={verifyMutation.isPending || deleteMutation.isPending}
              fullWidth={false}
              className={`w-full sm:w-auto px-8 !py-2.5 rounded-lg text-sm font-medium transition border-none text-white
                ${!isVerified
                ? "bg-gray-400 hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                : "bg-red-500 hover:bg-red-600 animate-pulse shadow-md shadow-red-500/20"
              }
              `}
            >
              {!isVerified ? "비밀번호 확인" : "진짜 탈퇴하기"}
            </Button>
          </div>

        </form>
      </div>
    </>
  );
};

export default UserDelete;