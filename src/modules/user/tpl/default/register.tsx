"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ClipboardCheck, LockKeyhole, Mail, UserRound } from "lucide-react";
import InputField from "@components/form/InputField";
import Button from "@components/button/Button";

const Register = () => {
  const [loading, setLoading] = useState(false); // ✅ 로딩 상태 추가
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const router = useRouter();

  const refAccountId = useRef<HTMLInputElement>(null);
  const refEmail = useRef<HTMLInputElement>(null);
  const refPassword = useRef<HTMLInputElement>(null);
  const refNickName = useRef<HTMLInputElement>(null);

  const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormMessage(null);
    setFieldErrors(null);
    setLoading(true); // ✅ 통신 시작 시 true

    const formData = new FormData(e.currentTarget);

    try {
      // ... (fetch 로직 생략)
      const response = await fetch("/api/user", {
        method: "POST",
        body: formData,
        credentials: "include", // 쿠키 포함
      });
      const res = await response.json();
      if (res.type === "error") {
        const errors = res.fieldErrors || res.data || null;

        if (errors && typeof errors === "object") {
          setFieldErrors(errors);

          if (errors.accountId) refAccountId.current?.focus();
          else if (errors.email || errors.email_address) refEmail.current?.focus();
          else if (errors.password) refPassword.current?.focus();
          else if (errors.nickName) refNickName.current?.focus();
        } else {
          setFormMessage(res.message || "회원가입에 실패했습니다.");
        }
      } else if (res.type === "success") {
        router.replace("/auth/signin");
      }
    } catch (err) {
      setFormMessage("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false); // ✅ 통신 종료(성공/실패 모두) 시 false
    }

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
      className="w-full"
      variants={variants}
      initial="hidden"
      animate="onscreen"
      exit="offscreen"
    >
      <motion.div className="pb-8" variants={variants}>
        <div className="text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500 dark:text-dark-400">
          Create account
        </div>
        <h1 className="mt-4 text-[32px] font-semibold leading-tight tracking-[-0.045em] text-gray-950 dark:text-white">
          회원가입
        </h1>
        <p className="mt-4 text-sm leading-6 tracking-[-0.02em] text-gray-500 dark:text-dark-300">
          서비스 이용에 필요한 기본 계정을 생성합니다.
        </p>
      </motion.div>
      {formMessage && (
        <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-500 dark:bg-red-500/10 dark:text-red-300">
          {formMessage}
        </div>
      )}
      <form onSubmit={submitHandler} className="space-y-5">
        <div>
          <InputField
            inputTitle="아이디"
            name="accountId"
            placeholder="사용할 아이디"
            icon={<UserRound className="h-5 w-5" />}
            ref={refAccountId}
            error={fieldErrors?.accountId}
          />
        </div>
        <div>
          <InputField
            inputTitle="이메일"
            name="email"
            type="email"
            placeholder="example@mail.com"
            icon={<Mail className="h-5 w-5" />}
            ref={refEmail}
            error={fieldErrors?.email || fieldErrors?.email_address}
          />
        </div>

        <div>
          <InputField
            inputTitle="비밀번호"
            name="password"
            type="password"
            placeholder="비밀번호"
            icon={<LockKeyhole className="h-5 w-5" />}
            ref={refPassword}
            error={fieldErrors?.password}
          />
          <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-dark-400">
            영문, 숫자, 특수문자를 포함해 입력해주세요.
          </p>
        </div>

        <div>
          <InputField
            inputTitle="닉네임"
            name="nickName"
            placeholder="표시할 닉네임"
            icon={<ClipboardCheck className="h-5 w-5" />}
            ref={refNickName}
            error={fieldErrors?.nickName}
          />
          <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-dark-400">
            닉네임은 2~12자 범위로 입력합니다.
          </p>
        </div>

        <div className="pt-1">
          <Button
            isLoading={loading}
            fullWidth
            type="submit"
            className="!min-h-12 !rounded-xl !border-black !bg-black !text-white hover:!bg-gray-900 dark:!border-white dark:!bg-white dark:!text-black dark:hover:!bg-gray-100"
          >
            가입하기
          </Button>
        </div>
      </form>
      <motion.div className="mt-8 text-sm text-gray-500 dark:text-dark-400" variants={variants}>
        이미 계정이 있으신가요?{" "}
        <Link href="/auth/signin" className="text-gray-950 underline underline-offset-4 hover:text-gray-600 dark:text-white dark:hover:text-dark-200">
          로그인
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default Register;
