"use client";

import React, { useState, useEffect, useRef } from "react";
import Alert from "@plextype/components/message/Alert";

import { PasswordChange } from "@/extentions/user/scripts/userController";
import HeaderUser from "@/extentions/user/templates/default/header";

const ChangePassword = (props) => {
  const [error, setError] = useState<{ type: string; message: string } | null>(
    null,
  );

  const submitHandler = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append("nowPasswordValue", e.target.now_password.value);
    formData.append("newPasswordValue", e.target.new_password.value);
    formData.append("renewPasswordValue", e.target.renew_password.value);

    try {
      const response = await fetch("/api/user/password", {
        method: "PUT",
        body: formData,
        credentials: "include",
      });

      let responseData = null; // 응답 데이터를 저장할 변수

      try {
        responseData = await response.json(); // 한 번만 실행
      } catch (jsonError) {
        console.error("JSON 파싱 오류:", jsonError);
      }
      console.log(responseData);
      // setError({
      //   type: "success",
      //   message: "성공적으로 비밀번호가 변경되었습니다.",
      // });
      setError(responseData);
    } catch (error: any) {
      console.error("패스워드 변경 오류:", error);
      setError({
        type: "error",
        message: error.message || "패스워드 변경에 실패했습니다.",
      });
    }
  };
  return (
    <>
      <form onSubmit={submitHandler}>
        <div className="px-5">
          {error && <Alert message={error.message} type={error.type} />}
          <div className="grid grid-cols-3 gap-4 py-3 mb-2 border-b border-gray-100">
            <div className="col-span-1 text-sm text-gray-400 p-2">
              이전 비밀번호
            </div>
            <div className="col-span-2">
              <input
                type="password"
                name="now_password"
                className="w-full py-2 border border-gray-200 hover:border-gray-900 focus:border-gray-900 px-5 rounded-lg outline-none"
                placeholder="비밀번호 변경"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 py-3 mb-2 border-b border-gray-100">
            <div className="col-span-1 text-sm text-gray-400 p-2">
              신규 비밀번호
            </div>
            <div className="col-span-2">
              <input
                type="password"
                name="new_password"
                className="w-full py-2 border border-gray-200 hover:border-gray-900 focus:border-gray-900 px-5 rounded-lg outline-none"
                placeholder="비밀번호 변경"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 py-3 mb-2">
            <div className="col-span-1 text-sm text-gray-400 p-2">
              신규 비밀번호 확인
            </div>
            <div className="col-span-2">
              <input
                type="password"
                name="renew_password"
                className="w-full py-2 border border-gray-200 hover:border-gray-900 focus:border-gray-900 px-5 rounded-lg outline-none"
                placeholder="비밀번호 변경"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 gap-[1px] bg-gray-200">
          <button className="flex-1 bg-white text-sm py-4 px-5 hover:bg-gray-100 hover:text-gray-900 text-gray-500">
            비우기
          </button>
          <button
            type="submit"
            className="flex-1 bg-white text-sm border-gray-200 py-4 px-5 hover:bg-blue-500 hover:text-white text-blue-500"
          >
            변경하기
          </button>
        </div>
      </form>
    </>
  );
};

export default ChangePassword;
