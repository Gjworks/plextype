"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient, useMutation } from "@tanstack/react-query";

import Popup from "@components/modal/Popup";
import Alert from "@components/message/Alert";
import ChangePassword from "./changePassword";
import HeaderUser from "@/modules/user/tpl/default/header";

import Button from "@components/button/Button"; // 💡 공용 버튼
// 💡 1. InputField 임포트 추가! (경로가 다르면 수정해주세요)
import InputField from "@components/form/InputField";

import { saveUserAction } from "@/modules/user/actions/user.action";
import { UserInfo } from "@/modules/user/actions/_type";

type Props = {
  initialUser: UserInfo; // 💡 page.tsx에서 받은 데이터
};

const UpdateUser = ({ initialUser }: Props) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showPopup, setShowPopup] = useState(false);
  const [error, setError] = useState<{ type: string; message: string } | null>(null);

  const closePopup = (close: boolean) => {
    setShowPopup(close);
  };

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // 💡 1. 기존에 넣었던 필수 정보들
      formData.append("id", initialUser.id.toString());
      formData.append("accountId", initialUser.accountId);
      formData.append("email_address", initialUser.email_address);
      formData.append("isAdmin", initialUser.isAdmin?.toString() || "false");

      formData.append("isProfileUpdate", "true");

      // 🌟 2. Zod 통과를 위한 "빈 서류" 끼워넣기!
      // (마이페이지에서는 비밀번호를 따로 변경하므로 빈 문자열로 넘겨줍니다)
      if (!formData.has("password")) {
        formData.append("password", "");
      }

      return await saveUserAction(formData);
    },
    onSuccess: async (res) => {
      if (!res.success) {
        // 🌟 3. 혹시 또 에러가 나면, Zod가 정확히 '어떤 필드' 때문에 화났는지 콘솔에 찍어봅니다!
        console.log("🚨 Zod 검증 실패 원인:", res.fieldErrors);
        setError({ type: res.type || "error", message: res.message });
        return;
      }

      alert("성공적으로 수정되었습니다.");
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      router.refresh();
    },
    onError: () => {
      setError({ type: "error", message: "회원 정보 수정 중 오류가 발생했습니다." });
    },
  });

  const handleUserInfoSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    mutation.mutate(formData);
  };

  return (
    <>
      <HeaderUser />
      <div className="max-w-screen-md mx-auto px-3 py-8">
        <form onSubmit={handleUserInfoSubmit}>
          <div>
            {error && <Alert message={error.message} type={error.type} />}
            <div className="border-b border-gray-200 dark:border-dark-800">

              {/* 🌟 1. 아이디 영역 */}
              <div className="grid grid-cols-3 gap-4 py-3 mb-2 border-b border-gray-100 dark:border-dark-800">
                <div className="col-span-1 text-sm text-gray-400 p-2">
                  아이디
                </div>
                <div className="col-span-2 text-sm text-gray-900 dark:text-dark-200 p-2">
                  {initialUser.accountId}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 py-3 mb-2 border-b border-gray-100 dark:border-dark-800">
                <div className="col-span-1 text-sm text-gray-400 p-2">
                  이메일
                </div>
                <div className="col-span-2 text-sm text-gray-900 dark:text-dark-200 p-2">
                  {initialUser.email_address}
                </div>
              </div>

              {/* 🌟 2. 프로필 이미지 영역 */}
              <div className="grid grid-cols-3 gap-4 py-3 mb-2 border-b border-gray-100 dark:border-dark-800">
                <div className="col-span-1 text-sm text-gray-400 p-2">
                  프로필 이미지
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-8">
                    <div
                      className="relative text-gray-300 rounded-full w-20 h-20 bg-gray-200 hover:bg-gray-300 dark:bg-dark-800 dark:hover:bg-dark-700"></div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs border-green-500 border py-1 px-3 rounded-lg hover:bg-green-500 hover:text-white text-green-500">
                        변경하기
                      </button>
                      <button
                        type="button"
                        className="text-xs border-rose-500 border py-1 px-3 rounded-lg hover:bg-rose-500 hover:text-white text-rose-500">
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 🌟 3. 비밀번호 영역 */}
              <div className="grid grid-cols-3 gap-4 py-3 mb-2 border-b border-gray-100 dark:border-dark-800">
                <div className="col-span-1 text-sm text-gray-400 p-2">
                  비밀번호
                </div>
                <div className="col-span-2 flex items-center">
                  <a
                    className="text-xs border-purple-500 border py-2 px-3 rounded-lg hover:bg-purple-500 hover:text-white text-purple-500 cursor-pointer"
                    onClick={() => setShowPopup(true)}
                  >
                    비밀번호 변경
                  </a>
                </div>
              </div>

              {/* 🌟 4. 닉네임 영역 (InputField 적용!) */}
              <div className="grid grid-cols-3 gap-4 py-3 mb-2">
                <div className="col-span-1 text-sm text-gray-400 p-2">
                  닉네임
                </div>
                <div className="col-span-2">
                  {/* 💡 타입스크립트가 요구하는 inputTitle을 추가했습니다! */}
                  <InputField
                    inputTitle="닉네임"
                    type="text"
                    name="nickName"
                    placeholder="변경할 닉네임을 입력해주세요."
                    defaultValue={initialUser.nickName}
                  />
                </div>
              </div>
            </div>

            {/* 🌟 5. 하단 버튼 영역 */}
            <div className="flex items-center justify-center gap-4 pt-4 pb-10 px-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-sm py-2 px-5 rounded-lg hover:bg-rose-500 hover:text-white text-rose-500 bg-rose-100">
                뒤로가기
              </button>

              <Button
                type="submit"
                isLoading={mutation.isPending}
                fullWidth={false}
              >
                저장하기
              </Button>
            </div>
          </div>
        </form>
      </div>

      <Popup id="change-password-popup" state={showPopup} title="비밀번호 변경" close={closePopup}>
        <ChangePassword close={closePopup} />
      </Popup>
    </>
  );
};

export default UpdateUser;