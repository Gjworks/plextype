"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Warning from "@plextype/components/message/Warning";

import { motion } from "framer-motion";
import Alert from "@plextype/components/message/Alert";
// import { createUser } from "@/extentions/user/scripts/userController";

const Register = () => {
  const [error, setError] = useState<{ type: string; message: string } | null>(
    null,
  );
  const router = useRouter();

  const submitHandler = async (e) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("accountId", e.target.accountId.value);
    formData.append("password", e.target.password.value);
    formData.append("nickName", e.target.nickName.value);

    const response = await fetch("/api/user", {
      method: "POST",
      body: formData,
      credentials: "include", // 쿠키 포함
    });

    const res = await response.json();
    const { type, message, data, accessToken, element } = res;

    console.log(type);
    if (res.type === "error") {
      setError({ type, message });
    }

    if (res.type === "success") {
      router.replace("/auth/signin");
    }
    // await createUser(formData)
    //   .then((response) => {
    //     console.log(response);
    //     if (response?.type === "error") {
    //       console.log(response);
    //       setError(response.message);
    //     } else {
    //       router.replace("/auth/signin");
    //     }
    //   })
    //   .catch((error) => {
    //     console.error("Failed to register: " + error.toString());
    //   });
  };

  const variants = {
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
    <motion.div
      className=""
      variants={variants}
      initial="hidden"
      animate="onscreen"
      exit="offscreen"
    >
      <motion.div className="flex justify-center py-10" variants={variants}>
        <div>
          <div className="mb-4 flex justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
              className="w-10 h-10 text-black dark:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"
              />
            </svg>
          </div>

          <div className="text-2xl text-dark-800 dark:text-dark-50 text-center">
            Register
          </div>
          <div className="text-dark-600 text-sm pt-5 text-center">
            회원가입을 해주셔서 감사드립니다.
          </div>
          <div className="text-dark-600 text-sm text-center">
            회원님의 정보는 안전하게 저장되어 보관됩니다.
          </div>
        </div>
      </motion.div>
      {error && <Alert message={error.message} type={error.type} />}
      <form onSubmit={submitHandler}>
        <div className="relative mb-5 w-full">
          <div className="flex items-center w-full text-xs">
            <div className="group flex items-center w-full border-[0.5px] border-gray-300 dark:border-dark-600/75 dark:hover:border-dark-300 dark:focus:border-dark-300 rounded-full dark:bg-dark-950/20 transition-all duration-300 backdrop-blur-sm bg-gray-50/50">
              <div className="px-5">
                <span className="text-dark-300">아이디(이메일)</span>
              </div>
              <input
                type="text"
                name="accountId"
                id="accountId"
                className="autofill:bg-transparent outline-none bg-transparent text-sm py-3 pr-3 text-black flex-1 placeholder:text-dark-500/75 dark:text-white"
                placeholder="example@mail.com"
              />
            </div>
          </div>
        </div>

        <div className="relative mb-5 w-full">
          <div className="flex items-center w-full text-xs">
            <div className="group flex items-center w-full border-[0.5px] border-gray-300 dark:border-dark-600/75 dark:hover:border-dark-300 dark:focus:border-dark-300 rounded-full dark:bg-dark-950/20 transition-all duration-300 backdrop-blur-sm bg-gray-50/50">
              <div className="px-5">
                <span className="text-dark-300">비밀번호</span>
              </div>
              <input
                type="password"
                name="password"
                id=""
                className="autofill:bg-transparent outline-none bg-transparent text-sm py-3 pr-3 text-black flex-1 placeholder:text-dark-500/75 dark:text-white"
                placeholder="User Password"
              />
            </div>
          </div>
          <div className="text-dark-400 text-xs pt-2 px-2">
            비밀번호는 암호화 되어 안전하게 저장됩니다.
          </div>
        </div>
        <div className="relative mb-5 w-full">
          <div className="flex items-center w-full text-xs">
            <div className="group flex items-center w-full border-[0.5px] border-gray-300 dark:border-dark-600/75 dark:hover:border-dark-300 dark:focus:border-dark-300 rounded-full dark:bg-dark-950/20 transition-all duration-300 backdrop-blur-sm bg-gray-50/50">
              <div className="px-5">
                <span className="text-dark-300">닉네임</span>
              </div>
              <input
                type="text"
                name="nickName"
                id=""
                className="autofill:bg-transparent outline-none bg-transparent text-sm py-3 pr-3 text-black flex-1 placeholder:text-dark-500/75 dark:text-white"
                placeholder="User nick name"
              />
            </div>
          </div>
        </div>

        <div className="mb-2">
          <button className="flex justify-center items-center w-full bg-slate-900 dark:bg-primary-700 dark:hover:bg-primary-600 hover:text-white dark:hover:text-white dark:text-white text-white py-3 px-5 rounded-lg transition duration-300 hover:bg-slate-700 text-sm">
            Register Completed
          </button>
        </div>
      </form>
      <motion.div className="divider" variants={variants}>
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-dark-600 to-transparent"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="backdrop-blur-sm px-4 text-xs text-dark-400 bg-white dark:bg-dark-950">
              OR
            </span>
          </div>
        </div>
      </motion.div>
      <motion.div className="pb-10" variants={variants}>
        <div className="w-full">
          <div className="w-full">
            <Link href="/auth/Signin" className="group text-sm text-dark-500">
              계정이 이미 있으시다면{" "}
              <span className="group-hover:text-gray-500 text-gray-600 dark:group-hover:text-dark-400 dark:text-dark-200 underline">
                Sign In
              </span>
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Register;
