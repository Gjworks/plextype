"use client";

import Link from "next/link";
import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LockKeyhole, LogIn, UserRound } from "lucide-react";

import Button from "@components/button/Button";
import InputField from "@components/form/InputField";
import { ActionResponse } from "@/core/types/actions";
import { useToastStore } from "@/core/store/useToastStore";

const Signin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const accountIdRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);

  const signIn = async (formData: FormData) => {
    const response = await fetch("/api/auth/signin", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    const data = await response.json();

    if (!response.ok) throw data;
    return data;
  };

  const mutation = useMutation<any, ActionResponse, FormData>({
    mutationFn: signIn,
    onSuccess: async (res) => {
      if (res.type === "error") {
        const errors = (res as any).fieldErrors || (res.element ? { [res.element]: res.message } : null);
        if (errors) {
          setFieldErrors(errors);
          if (errors.accountId) accountIdRef.current?.focus();
          if (errors.password) passwordRef.current?.focus();
        } else {
          setFormMessage(res.message);
        }
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["user"] });
      addToast("로그인되었습니다.", "info", { title: "로그인" });
      router.replace("/");
    },
    onError: (error) => {
      const errors = (error as any).fieldErrors || ((error as any).element ? { [(error as any).element]: error.message } : null);

      if (errors) {
        setFieldErrors(errors);
        if (errors.accountId) accountIdRef.current?.focus();
        else if (errors.password) passwordRef.current?.focus();
        return;
      }

      setFormMessage(error.message || "로그인 중 오류가 발생했습니다.");
    },
  });

  const submitHandler = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage(null);
    setFieldErrors(null);
    mutation.mutate(new FormData(event.currentTarget));
  };

  return (
    <motion.form
      onSubmit={submitHandler}
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      <div className="pb-9">
        <div className="text-[12px] font-medium uppercase tracking-[0.18em] text-gray-500 dark:text-dark-400">
          Welcome back
        </div>
        <h1 className="mt-4 text-[34px] font-semibold leading-tight tracking-[-0.045em] text-gray-950 dark:text-white">
          로그인
        </h1>
        <p className="mt-5 text-sm leading-6 tracking-[-0.02em] text-gray-500 dark:text-dark-300">
          등록된 계정으로 로그인해 주세요.
        </p>
      </div>

      {formMessage && (
        <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-500 dark:bg-red-500/10 dark:text-red-300">
          {formMessage}
        </div>
      )}

      <div className="space-y-5">
        <InputField
          inputTitle="아이디"
          name="accountId"
          type="text"
          placeholder="아이디"
          icon={<UserRound className="h-5 w-5" />}
          ref={accountIdRef}
          error={fieldErrors?.accountId}
        />
        <InputField
          inputTitle="비밀번호"
          name="password"
          type="password"
          placeholder="비밀번호"
          icon={<LockKeyhole className="h-5 w-5" />}
          ref={passwordRef}
          error={fieldErrors?.password}
        />
        <Button
          type="submit"
          isLoading={mutation.isPending}
          fullWidth
          icon={<LogIn className="h-4 w-4" />}
          className="!min-h-12 !rounded-xl !border-[#0a3d2d] !bg-[#0a3d2d] !text-white hover:!border-[#125841] hover:!bg-[#125841] dark:!border-[#b8f3d5] dark:!bg-[#b8f3d5] dark:!text-[#062c20] dark:hover:!border-white dark:hover:!bg-white"
        >
          로그인
        </Button>
      </div>

      <div className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-dark-400">
        <Link href="/auth/register" className="hover:text-[#0a3d2d] dark:hover:text-[#b8f3d5]">
          회원가입
        </Link>
        <Link href="/auth/find" className="hover:text-[#0a3d2d] dark:hover:text-[#b8f3d5]">
          계정 또는 비밀번호 찾기
        </Link>
      </div>
    </motion.form>
  );
};

export default Signin;
