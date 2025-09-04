"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

import { useRouter } from "next/navigation";

// import { store } from "@plextype/redux/store";
// import { fetchSignIn } from "@plextype/redux/features/userSlice";
import { useQueryClient, useMutation } from "@tanstack/react-query";

import { motion } from "framer-motion";
import Alert from "@plextype/components/message/Alert";

interface SignData {
  type: string;
  element: string;
  message: string;
  userInfo: {
    id: number;
    uuid: string;
    accountId: string;
    nickName: string;
    password: string;
    email_address: string;
    createdAt: string;
    updateAt: string;
  };
}

const Signin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  // const dispatch = store.dispatch;

  const [user, setUser] = useState<SignData>();
  const [error, setError] = useState<{ type: string; message: string } | null>(
    null,
  );

  const refInputUserId = useRef<HTMLInputElement>(null);
  const refInputPassword = useRef<HTMLInputElement>(null);

  const signIn = async (formData: FormData) => {
    const response = await fetch("/api/auth/signin", {
      method: "POST",
      body: formData,
      credentials: "include", // 쿠키 포함
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "로그인 실패");
    }

    return response.json(); // { result, accessToken }
  };

  const mutation = useMutation({
    mutationFn: signIn,
    onSuccess: async (res) => {
      // onSuccess를 async 함수로 변경
      const { type, message, data, accessToken, element } = res;

      if (type === "error") {
        setError({ type, message });
        if (element === "accountId" && refInputUserId.current) {
          refInputUserId.current.focus();
        }
        if (element === "password" && refInputPassword.current) {
          refInputPassword.current.focus();
        }
        return;
      }

      if (data) {
        setUser(res);
      }
      await queryClient.invalidateQueries({ queryKey: ["user"] });

      router.replace("/");
    },
    onError: (error) => {
      console.error("로그인 실패:", error);
    },
  });

  const submitHandler = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append("accountId", e.target.accountId.value);
    formData.append("password", e.target.password.value);

    mutation.mutate(formData);
    // dispatch(fetchSignIn({ formData })).then(
    //   (resultAction: ReturnType<typeof dispatch>) => {
    //     // 반환 값을 확인
    //     console.log(resultAction.payload);
    //     // 액션의 payload와 type에 대한 타입 정의
    //     type SignInResult = {
    //       result: SignData;
    //       accessToken: string;
    //     };
    //
    //     if (resultAction.payload) {
    //       // 반환된 액션에서 accessToken에 접근
    //       const accessToken = (resultAction.payload as SignInResult)
    //         .accessToken;
    //       const dataInfo = (resultAction.payload as SignInResult).result;
    //
    //       dataInfo && setUser(dataInfo);
    //
    //       accessToken && router.replace("/");
    //     }
    //   },
    // );
  };

  const parentVariants = {
    hidden: { opacity: 0, x: 44 },
    onscreen: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        delayChildren: 0.1,
        staggerChildren: 0.1,
      },
    },
    offscreen: {
      x: 44,
      opacity: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <>
      <motion.div
        initial="hidden"
        animate="onscreen"
        variants={parentVariants}
        exit="offscreen"
      >
        <form onSubmit={submitHandler}>
          <motion.div className="py-10" variants={parentVariants}>
            <div className="dark:text-dark-50 text-2xl font-semibold text-gray-700 text-center">
              Request Access
            </div>
            <div className="dark:text-dark-500 pt-10 text-sm text-gray-600 text-center">
              소셜로그인은 추후에 지원 됩니다. <br></br>일반 회원가입을
              이용하셔도 모든 서비스를 이용 할 수 있습니다.
            </div>
          </motion.div>
          {error && <Alert message={error.message} type={error.type} />}
          <motion.div variants={parentVariants}>
            <div className="relative mb-5 flex">
              <div className="flex w-full items-center text-xs">
                <div className="dark:border-dark-600/75 dark:hover:border-dark-300 dark:focus:border-dark-300 dark:bg-dark-950/20 group flex w-full items-center rounded-full border-[0.5px] border-gray-300 bg-gray-50/50 backdrop-blur-sm transition-all duration-300">
                  <div className="px-5">
                    <span className="dark:text-dark-300 group-hover:text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1}
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25"
                        />
                      </svg>
                    </span>
                  </div>
                  <input
                    type="text"
                    name="accountId"
                    ref={refInputUserId}
                    className="autofill:bg-transparent placeholder:text-dark-500/75 flex-1 bg-transparent py-3 pr-3 text-sm text-black outline-none dark:text-white"
                    placeholder="Your Account ID"
                  />
                </div>
                {/* <TextInput
                    inputType="email"
                    inputName="email"
                    inputTitle="Email"
                    placeholder="What's your Email"
                    getData={getData}
                    theme="light"
                    value=""
                  ></TextInput> */}
              </div>
            </div>
            <div className="relative mb-5 flex w-full">
              <div className="flex w-full items-center text-xs">
                <div className="dark:border-dark-600/75 dark:hover:border-dark-300 dark:focus:border-dark-300 dark:bg-dark-950/20 group flex w-full items-center rounded-full border-[0.5px] border-gray-300 bg-gray-50/50 backdrop-blur-sm transition-all duration-300">
                  <div className="px-5">
                    <span className="text-dark-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33"
                        />
                      </svg>
                    </span>
                  </div>
                  <input
                    type="password"
                    name="password"
                    ref={refInputPassword}
                    className="autofill:bg-transparent placeholder:text-dark-500/75 flex-1 bg-transparent py-3 pr-3 text-sm text-black outline-none dark:text-white"
                    placeholder="Your Password"
                  />
                </div>
                {/* <TextInput
                    inputType="password"
                    inputName="password"
                    inputTitle="비밀번호"
                    getData={getPassword}
                    placeholder="Your Password"
                    theme="light"
                    value=""
                  ></TextInput> */}
              </div>
            </div>

            <div className="mb-4 flex">
              <button
                type="submit"
                className="dark:bg-primary-700 dark:hover:bg-primary-600 flex w-full items-center justify-center rounded-lg bg-gray-900 px-5 py-3 text-sm text-white transition duration-300 hover:bg-gray-700 hover:text-white dark:text-white dark:hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
                <span className="pl-2 text-sm">Sign In</span>
              </button>
            </div>
          </motion.div>
        </form>
        <motion.div className="divider" variants={parentVariants}>
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="dark:via-dark-600 h-px w-full bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-xs text-gray-400 bg-white dark:bg-dark-950 backdrop-blur-sm">
                OR
              </span>
            </div>
          </div>
        </motion.div>
        <motion.div className="pb-8 pt-5" variants={parentVariants}>
          <div className="grid grid-cols-2 gap-2">
            <button className="dark:bg-dark-700/25 dark:hover:bg-dark-600/25 dark:text-dark-400 group col-span-2 flex cursor-pointer items-center justify-center rounded-md bg-gray-100 px-3 py-2 hover:bg-gray-200 sm:col-span-1 dark:hover:text-white">
              <div className="pr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="dark:fill-dark-400 h-5 w-5 fill-gray-500 stroke-1 group-hover:fill-gray-700 dark:group-hover:fill-white"
                  width="512"
                  height="512"
                  viewBox="0 0 512 512"
                >
                  <title>ionicons-v5_logos</title>
                  <path d="M349.13,136.86c-40.32,0-57.36,19.24-85.44,19.24C234.9,156.1,212.94,137,178,137c-34.2,0-70.67,20.88-93.83,56.45-32.52,50.16-27,144.63,25.67,225.11,18.84,28.81,44,61.12,77,61.47h.6c28.68,0,37.2-18.78,76.67-19h.6c38.88,0,46.68,18.89,75.24,18.89h.6c33-.35,59.51-36.15,78.35-64.85,13.56-20.64,18.6-31,29-54.35-76.19-28.92-88.43-136.93-13.08-178.34-23-28.8-55.32-45.48-85.79-45.48Z" />
                  <path d="M340.25,32c-24,1.63-52,16.91-68.4,36.86-14.88,18.08-27.12,44.9-22.32,70.91h1.92c25.56,0,51.72-15.39,67-35.11C333.17,85.89,344.33,59.29,340.25,32Z" />
                </svg>
              </div>
              <div className="dark:text-dark-400 text-xs text-gray-500 group-hover:text-gray-700 dark:group-hover:text-white">
                Apple
              </div>
            </button>
            <button className="dark:bg-dark-700/25 dark:hover:bg-dark-600/25 dark:text-dark-400 group col-span-2 flex cursor-pointer items-center justify-center rounded-md bg-gray-100 px-3 py-2 hover:bg-gray-200 sm:col-span-1 dark:hover:text-white">
              <div className="pr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="dark:fill-dark-400 h-5 w-5 fill-gray-500 stroke-1 group-hover:fill-gray-700 dark:group-hover:fill-white"
                  width="512"
                  height="512"
                  viewBox="0 0 512 512"
                >
                  <title>ionicons-v5_logos</title>
                  <path d="M256,32C132.3,32,32,134.9,32,261.7c0,101.5,64.2,187.5,153.2,217.9a17.56,17.56,0,0,0,3.8.4c8.3,0,11.5-6.1,11.5-11.4,0-5.5-.2-19.9-.3-39.1a102.4,102.4,0,0,1-22.6,2.7c-43.1,0-52.9-33.5-52.9-33.5-10.2-26.5-24.9-33.6-24.9-33.6-19.5-13.7-.1-14.1,1.4-14.1h.1c22.5,2,34.3,23.8,34.3,23.8,11.2,19.6,26.2,25.1,39.6,25.1a63,63,0,0,0,25.6-6c2-14.8,7.8-24.9,14.2-30.7-49.7-5.8-102-25.5-102-113.5,0-25.1,8.7-45.6,23-61.6-2.3-5.8-10-29.2,2.2-60.8a18.64,18.64,0,0,1,5-.5c8.1,0,26.4,3.1,56.6,24.1a208.21,208.21,0,0,1,112.2,0c30.2-21,48.5-24.1,56.6-24.1a18.64,18.64,0,0,1,5,.5c12.2,31.6,4.5,55,2.2,60.8,14.3,16.1,23,36.6,23,61.6,0,88.2-52.4,107.6-102.3,113.3,8,7.1,15.2,21.1,15.2,42.5,0,30.7-.3,55.5-.3,63,0,5.4,3.1,11.5,11.4,11.5a19.35,19.35,0,0,0,4-.4C415.9,449.2,480,363.1,480,261.7,480,134.9,379.7,32,256,32Z" />
                </svg>
              </div>
              <div className="dark:text-dark-400 text-xs text-gray-500 group-hover:text-gray-700 dark:group-hover:text-white">
                Github
              </div>
            </button>
            <button className="dark:bg-dark-700/25 dark:hover:bg-dark-600/25 dark:text-dark-400 group col-span-2 flex cursor-pointer items-center justify-center rounded-md bg-gray-100 px-3 py-2 hover:bg-gray-200 sm:col-span-1 dark:hover:text-white">
              <div className="pr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="dark:fill-dark-400 h-5 w-5 fill-gray-500 stroke-1 group-hover:fill-gray-700 dark:group-hover:fill-white"
                  width="512"
                  height="512"
                  viewBox="0 0 512 512"
                >
                  <title>ionicons-v5_logos</title>
                  <path d="M496,109.5a201.8,201.8,0,0,1-56.55,15.3,97.51,97.51,0,0,0,43.33-53.6,197.74,197.74,0,0,1-62.56,23.5A99.14,99.14,0,0,0,348.31,64c-54.42,0-98.46,43.4-98.46,96.9a93.21,93.21,0,0,0,2.54,22.1,280.7,280.7,0,0,1-203-101.3A95.69,95.69,0,0,0,36,130.4C36,164,53.53,193.7,80,211.1A97.5,97.5,0,0,1,35.22,199v1.2c0,47,34,86.1,79,95a100.76,100.76,0,0,1-25.94,3.4,94.38,94.38,0,0,1-18.51-1.8c12.51,38.5,48.92,66.5,92.05,67.3A199.59,199.59,0,0,1,39.5,405.6,203,203,0,0,1,16,404.2,278.68,278.68,0,0,0,166.74,448c181.36,0,280.44-147.7,280.44-275.8,0-4.2-.11-8.4-.31-12.5A198.48,198.48,0,0,0,496,109.5Z" />
                </svg>
              </div>
              <div className="dark:text-dark-400 text-xs text-gray-500 group-hover:text-gray-700 dark:group-hover:text-white">
                Twitter
              </div>
            </button>
            <button className="dark:bg-dark-700/25 dark:hover:bg-dark-600/25 dark:text-dark-400 group col-span-2 flex cursor-pointer items-center justify-center rounded-md bg-gray-100 px-3 py-2 hover:bg-gray-200 sm:col-span-1 dark:hover:text-white">
              <div className="pr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="dark:fill-dark-400 h-5 w-5 fill-gray-500 stroke-1 group-hover:fill-gray-700 dark:group-hover:fill-white"
                  width="512"
                  height="512"
                  viewBox="0 0 512 512"
                >
                  <path d="M473.16,221.48l-2.26-9.59H262.46v88.22H387c-12.93,61.4-72.93,93.72-121.94,93.72-35.66,0-73.25-15-98.13-39.11a140.08,140.08,0,0,1-41.8-98.88c0-37.16,16.7-74.33,41-98.78s61-38.13,97.49-38.13c41.79,0,71.74,22.19,82.94,32.31l62.69-62.36C390.86,72.72,340.34,32,261.6,32h0c-60.75,0-119,23.27-161.58,65.71C58,139.5,36.25,199.93,36.25,256S56.83,369.48,97.55,411.6C141.06,456.52,202.68,480,266.13,480c57.73,0,112.45-22.62,151.45-63.66,38.34-40.4,58.17-96.3,58.17-154.9C475.75,236.77,473.27,222.12,473.16,221.48Z" />
                </svg>
              </div>
              <div className="dark:text-dark-400 text-xs text-gray-500 group-hover:text-gray-700 dark:group-hover:text-white">
                Google
              </div>
            </button>
          </div>
        </motion.div>
        <motion.div className="pb-10" variants={parentVariants}>
          <div className="flex flex-wrap">
            <div className="w-full">
              <Link
                href="/auth/register"
                className="text-dark-500 group text-sm"
              >
                회원가입을 하시려면
                <span className="dark:text-dark-200 dark:hover:text-dark-400 text-gray-500 underline hover:text-gray-600 group-hover:text-gray-600">
                  회원가입 하기
                </span>
              </Link>
            </div>
            <div className="w-full">
              <Link href="/" className="text-dark-500 group text-sm">
                계정ID와 비밀번호를 잊어버리 셨나요?
                <span className="dark:text-dark-200 dark:hover:text-dark-400 text-gray-500 underline hover:text-gray-600 group-hover:text-gray-600">
                  계정ID / 비밀번호 찾기
                </span>
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default Signin;
