"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";

import Popup from "@plextype/components/modal/Popup";
import Alert from "@plextype/components/message/Alert";
import ChangePassword from "./changePassword";

import { useUser } from "@plextype/hooks/auth/useAuth";

interface ResultInfo {
  type: string;
  element: string;
  message: string;
  data: {
    userInfo: UserInfo;
  };
}

const UpdateUser = (props: any) => {
  const queryClient = useQueryClient();
  const [showPopup, setShowPopup] = useState(false);
  const [loggedInfo, setLoggedInfo] = useState<UserInfo>();
  const [error, setError] = useState<{ type: string; message: string } | null>(
    null,
  );

  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (user) {
      setLoggedInfo(user);
    }
  }, [user]);

  const closePopup = (close) => {
    setShowPopup(close);
  };

  const mutation = useMutation({
    mutationFn: async (formData?: FormData) => {
      const response = await fetch("/api/user", {
        method: "PUT",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "수정 실패");
      }

      return response.json();
    },
    onSuccess: async () => {
      // 성공하면 user 데이터 다시 불러오기
      await queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error) => {
      console.error("회원 정보 수정 실패:", error);
    },
  });

  const handleUserInfoSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("nickName", e.target.nickName.value);

    mutation.mutate(formData);
  };
  return (
    <>
      <form onSubmit={handleUserInfoSubmit}>
        <div>
          {error && <Alert message={error.message} type={error.type} />}
          <div className="border-b border-gray-200 dark:border-dark-800">
            <div className="grid grid-cols-3 gap-4 py-3 mb-2 border-b border-gray-100 dark:border-dark-800">
              <div className="col-span-1 text-base text-gray-400 p-2">
                아이디
              </div>
              <div className="col-span-2 text-base text-gray-900 dark:text-dark-200 p-2">
                {loggedInfo && loggedInfo && loggedInfo.email_address}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 py-3 mb-2 border-b border-gray-100 dark:border-dark-800">
              <div className="col-span-1 text-base text-gray-400 p-2">
                프로필 이미지
              </div>
              <div className="col-span-2">
                <div className="flex items-center gap-8">
                  <div className="relative text-gray-300 rounded-full w-20 h-20 bg-gray-200 hover:bg-gray-300 dark:bg-dark-800 dark:hover:bg-dark-700"></div>
                  <div className="flex gap-2">
                    <button className="text-xs border-green-500 border py-1 px-3 rounded-lg hover:bg-green-500 hover:text-white text-green-500">
                      변경하기
                    </button>
                    <button className="text-xs border-rose-500 border py-1 px-3 rounded-lg hover:bg-rose-500 hover:text-white text-rose-500">
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 py-3 mb-2 border-b border-gray-100 dark:border-dark-800">
              <div className="col-span-1 text-base text-gray-400 p-2">
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
            <div className="grid grid-cols-3 gap-4 py-3 mb-2">
              <div className="col-span-1 text-base text-gray-400 p-2">
                닉네임
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  name="nickName"
                  className="w-full py-2 border border-gray-200 hover:border-gray-900 focus:border-gray-900 px-5 rounded-lg outline-none dark:bg-dark-900 dark:border-dark-700 dark:text-white"
                  placeholder="변경할 닉네임을 입력해주세요."
                  defaultValue={loggedInfo && loggedInfo && loggedInfo.nickName}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 pt-4 pb-10 px-3">
            <button className="text-sm border-rose-500 border py-2 px-5 rounded-lg hover:bg-rose-500 hover:text-white text-rose-500">
              뒤로가기
            </button>
            <button className="text-sm border-blue-500 border py-2 px-5 rounded-lg hover:bg-blue-500 hover:text-white text-blue-500">
              저장하기
            </button>
          </div>
        </div>
      </form>
      <Popup state={showPopup} title="비밀번호 변경" close={closePopup}>
        <ChangePassword close={closePopup} />
      </Popup>
    </>
  );
};

export default UpdateUser;
