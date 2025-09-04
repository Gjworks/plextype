"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useSelector } from "react-redux";
import { RootState } from "@plextype/redux/store";
import { store } from "@plextype/redux/store";
import { resetUserInfo } from "@plextype/redux/features/userSlice";
import Warning from "@plextype/components/message/Warning";

import { deleteUser } from "@/extentions/user/scripts/userController";

const UserDelete = (props: any) => {
  const router = useRouter();
  const dispatch = store.dispatch;
  const [showPopup, setShowPopup] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loggedInfo, setLoggedInfo] = useState<UserInfo>();
  const [error, setError] = useState<{ type: string; message: string } | null>(
    null,
  );
  const [inputState, setInputState] = useState<Boolean>(false);

  const userInfo = useSelector((state: RootState) => state.userInfo);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    setAccessToken(accessToken);

    userInfo && userInfo.session && setLoggedInfo(userInfo.session);
  }, [userInfo]);

  const handlerUserDeleteInput = (event) => {
    event.preventDefault();
    console.log(event.target.value);
    if (event.target.value === "회원탈퇴") {
      console.log("user deleted!!");
      setInputState(true);
    } else {
      setInputState(false);
    }
  };

  const handlerUserDeleteButton = async (event) => {
    event.preventDefault();
    if (inputState === true && accessToken) {
      await deleteUser({ accessToken: accessToken })
        .then((response) => {
          if (response.type === "success") {
            dispatch(resetUserInfo());
            localStorage.removeItem("accessToken");
            router.replace("/");
          } else {
            alert(response.message);
          }
        })
        .catch((error) => {
          console.log(error);
          console.log("Error >> " + error.code, error.response.message);
          setError(error.response.message);
          return error.response;
        });
      // await fetch('/user/api/handler', {
      //   method: 'DELETE',
      //   headers: {
      //     Authorization: `Bearer ${accessToken}`,
      //   },
      // })
      //   .then(res => {
      //     console.log(res)
      //     dispatch(resetUserInfo())
      //     localStorage.removeItem('accessToken')
      //     router.replace('/')
      //   })
      //   .catch(error => {
      //     console.log(error)
      //     console.log('Error >> ' + error.code, error.response.data.message)
      //     setError(error.response.data.message)
      //     return error.response
      //   })
    }
  };

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-xl border border-gray-200/75 bg-gray-100 p-5 shadow-lg shadow-gray-100/90 dark:bg-dark-800 dark:border-dark-700 dark:shadow-dark-900/70 backdrop-blur-xl lg:p-10 h-full mb-6">
        <div className="text-xl font-semibold mb-6 dark:text-white">
          회원 탈퇴
        </div>
        <div>
          <Warning message="한번 탈퇴된 회원은 복구가 되지 않습니다. 신중하게 선택하시기 바랍니다." />
        </div>
        <div className="mb-5">
          <input
            type="text"
            onChange={handlerUserDeleteInput}
            name="user_delete"
            placeholder="회원 탈퇴 를 입력해주세요."
            className={
              "block py-2 px-3 rounded-lg w-full border border-gray-300 text-base outline-none dark:bg-dark-700 dark:border-dark-600 dark:focus:border-dark-400 " +
              (inputState === false
                ? " focus:border-rose-600 text-rose-500 "
                : " focus:border-cyan-500 border-cyan-500 text-cyan-600 ")
            }
          />
        </div>
        <div className="text-gray-500 text-base">
          회원 탈퇴를 하실려면 아래 문구를 입력 후 탈퇴 하기 버튼을 눌러 주시기
          바랍니다.
        </div>
        <div className="text-gray-500 text-base">
          회원 탈퇴로 인해 삭제가 되는 데이터는 아래와 같습니다.
        </div>
        <div className="pl-8 mb-4">
          <ol className="list-decimal text-sm text-gray-600">
            <li>회원 정보 (이메일, 프로필, 비밀번호, 그룹정보)</li>
            <li>웹사이트내 이용중인 서비스</li>
          </ol>
        </div>
        <div className="text-gray-500 text-base">
          회원 탈퇴로 인해 삭제가 되지 않는 데이터
        </div>
        <div className="pl-8">
          <ol className="list-decimal text-sm text-gray-600">
            <li>서비스 신청내역</li>
            <li>1:1문의 내역</li>
            <li>댓글 및 기타 커뮤니티 활동에 의한 게시글 또는 첨부파일</li>
          </ol>
        </div>
        <div className="flex justify-center gap-4 pt-8">
          <button
            className={
              "text-gray-100 px-8 py-2 rounded-lg " +
              (inputState === false
                ? " bg-gray-400 hover:bg-gray-500 "
                : " bg-black ")
            }
            disabled={inputState === false}
            onClick={handlerUserDeleteButton}
          >
            탈퇴 하기
          </button>
        </div>
      </div>
    </>
  );
};

export default UserDelete;
