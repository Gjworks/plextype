"use client";

import React, { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";

import Alert from "@/core/components/message/Alert";
import InputField from "@/core/components/form/InputField";
import Button from "@/core/components/button/Button";

import { changePassword } from "@modules/user/_actions/user.action";

const ChangePassword = ({ close }: { close: (state: boolean) => void }) => {
  const [error, setError] = useState<{ type: string; message: string } | null>(null);

  // 💡 폼 내부의 input 요소들을 찾기 위한 Ref
  const formRef = useRef<HTMLFormElement>(null);

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await changePassword(formData);
    },
    onSuccess: (res) => {
      if (!res.success) {
        // 1. 최상단 Alert용 에러 메시지 세팅
        setError({ type: res.type || "error", message: res.message });

        // 🌟 2. fieldErrors가 넘어왔다면, 첫 번째 에러 인풋을 찾아서 포커스(커서 이동) 시킵니다!
        if (res.fieldErrors) {
          const firstErrorKey = Object.keys(res.fieldErrors)[0]; // ex) "nowPassword"

          // 폼 안에서 name="nowPassword" 인 요소를 찾음
          const errorElement = formRef.current?.elements.namedItem(firstErrorKey) as HTMLInputElement;

          if (errorElement) {
            errorElement.focus(); // 🎯 찌릿! 커서 이동!
          }
        }
        return;
      }

      alert("성공적으로 비밀번호가 변경되었습니다.");
      close(false);
    },
    onError: () => {
      setError({ type: "error", message: "패스워드 변경에 실패했습니다." });
    },
  });

  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    // 💡 HTML의 name 속성들을 카멜케이스로 통일했습니다.
    const nowPassword = form.nowPassword.value;
    const newPassword = form.newPassword.value;
    const renewPassword = form.renewPassword.value;

    if (!nowPassword || !newPassword || !renewPassword) {
      setError({ type: "error", message: "모든 필드를 입력해주세요." });
      return;
    }
    if (newPassword !== renewPassword) {
      setError({ type: "error", message: "신규 비밀번호가 일치하지 않습니다." });
      // 💡 여기서도 신규 비밀번호 확인창으로 포커스 보내기 가능!
      const renewInput = form.elements.namedItem("renewPassword") as HTMLInputElement;
      if (renewInput) renewInput.focus();
      return;
    }

    const formData = new FormData();
    formData.append("nowPassword", nowPassword);
    formData.append("newPassword", newPassword);

    mutation.mutate(formData);
  };

  return (
    <form ref={formRef} onSubmit={submitHandler}>
      <div className="px-5">
        {error && <Alert message={error.message} type={error.type} />}

        <div className="grid grid-cols-3 gap-4 py-3 mb-2 border-b border-gray-100">
          <div className="col-span-1 text-sm text-gray-400 p-2">이전 비밀번호</div>
          <div className="col-span-2">
            {/* 💡 name을 서버와 동일한 nowPassword 로 변경! */}
            <InputField
              inputTitle=""
              type="password"
              name="nowPassword"
              placeholder="현재 비밀번호 입력"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 py-3 mb-2 border-b border-gray-100">
          <div className="col-span-1 text-sm text-gray-400 p-2">신규 비밀번호</div>
          <div className="col-span-2">
            {/* 💡 name을 newPassword 로 변경! */}
            <InputField
              inputTitle=""
              type="password"
              name="newPassword"
              placeholder="새 비밀번호 입력"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 py-3 mb-2">
          <div className="col-span-1 text-sm text-gray-400 p-2">신규 비밀번호 확인</div>
          <div className="col-span-2">
            {/* 💡 name을 renewPassword 로 변경! */}
            <InputField
              inputTitle=""
              type="password"
              name="renewPassword"
              placeholder="새 비밀번호 다시 입력"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 gap-[1px] bg-gray-200 mt-4">
        <button
          type="button"
          onClick={() => formRef.current?.reset()}
          className="flex-1 bg-white text-sm py-4 px-5 hover:bg-gray-100 hover:text-gray-900 text-gray-500 transition"
        >
          비우기
        </button>

        <Button
          type="submit"
          isLoading={mutation.isPending}
          fullWidth={false}
          className="flex-1 !rounded-none !py-4 bg-white !text-blue-500 border-none hover:!bg-blue-500 hover:!text-white transition"
        >
          변경하기
        </Button>
      </div>
    </form>
  );
};

export default ChangePassword;