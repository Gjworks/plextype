"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Alert from "@plextype/components/message/Alert";

const FindAccountID = () => {
  const [phase, setPhase] = useState<"input" | "result">("input");
  const [foundId, setFoundId] = useState<string>("");
  const [error, setError] = useState<{ type: string; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const target = e.currentTarget;
    const nickName = (target.elements.namedItem("nickName") as HTMLInputElement).value;
    const email = (target.elements.namedItem("email") as HTMLInputElement).value;

    // TODO: API 연동 로직 (가상 예시)
    try {
      // const res = await fetch("/api/auth/find-id", { ... });
      // 결과가 있다고 가정
      setTimeout(() => {
        if (nickName === "테스트") { // 예시용 실패 로직
          setFoundId("user****@example.com");
          setPhase("result");
        } else {
          setError({ type: "error", message: "일치하는 정보가 없습니다." });
        }
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError({ type: "error", message: "서버 오류가 발생했습니다." });
      setLoading(false);
    }
  };

  const variants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  };

  const inputContainerClass =
    "group flex w-full items-center rounded-md border border-gray-200 bg-white shadow-sm transition-all duration-200 " +
    "hover:border-gray-400 focus-within:border-gray-950 focus-within:ring-1 focus-within:ring-gray-950 " +
    "dark:border-dark-700 dark:bg-dark-900 dark:hover:border-dark-500 dark:focus-within:border-dark-300 dark:focus-within:ring-dark-300";

  return (
    <div className="max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {phase === "input" ? (
          <motion.div key="input" variants={variants} initial="hidden" animate="visible" exit="exit">
            <div className="text-center py-10">
              <div className="mb-4 flex justify-center text-gray-700 dark:text-dark-50">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-700 dark:text-dark-50">아이디 찾기</h2>
              <p className="text-gray-500 dark:text-dark-400 text-sm mt-3">가입 시 등록한 이름과 이메일을 입력해주세요.</p>
            </div>

            {error && <Alert message={error.message} type={error.type} />}

            <form onSubmit={submitHandler} className="space-y-5">
              <div>
                <label className="block text-sm text-black dark:text-dark-200 mb-2 font-medium">닉네임 (이름)</label>
                <div className={inputContainerClass}>
                  <div className="pl-3 pr-2 text-gray-400 group-focus-within:text-gray-800 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <input type="text" name="nickName" required className="w-full bg-transparent py-2.5 pr-3 text-sm outline-none dark:text-white" placeholder="닉네임을 입력하세요" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-black dark:text-dark-200 mb-2 font-medium">등록된 이메일</label>
                <div className={inputContainerClass}>
                  <div className="pl-3 pr-2 text-gray-400 group-focus-within:text-gray-800 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <input type="email" name="email" required className="w-full bg-transparent py-2.5 pr-3 text-sm outline-none dark:text-white" placeholder="example@mail.com" />
                </div>
              </div>

              <button disabled={loading} className="w-full bg-gray-900 dark:bg-primary-700 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors flex justify-center items-center">
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "아이디 찾기"}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div key="result" variants={variants} initial="hidden" animate="visible" exit="exit" className="text-center py-10">
            <div className="mb-6 flex justify-center text-cyan-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-dark-50">아이디를 찾았습니다!</h2>
            <div className="mt-8 p-6 bg-gray-50 dark:bg-dark-900 rounded-lg border border-gray-100 dark:border-dark-800">
              <p className="text-sm text-gray-500 dark:text-dark-400">회원님의 아이디는 다음과 같습니다.</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-2 select-all">{foundId}</p>
            </div>

            <div className="mt-8 space-y-3">
              <Link href="/auth/signin" className="block w-full bg-gray-900 dark:bg-primary-700 text-white py-3 rounded-lg font-medium hover:bg-gray-800">
                로그인하러 가기
              </Link>
              <button onClick={() => setPhase("input")} className="block w-full text-gray-500 hover:text-gray-800 text-sm underline">
                다시 찾기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="my-12 pt-6 border-t border-gray-100 dark:border-dark-800">
        <Link href="/auth/signin" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          로그인 화면으로 돌아가기
        </Link>
      </div>
    </div>
  );
};

export default FindAccountID;