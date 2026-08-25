"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SigninError = {
  message?: string;
  element?: string;
  fieldErrors?: Record<string, string>;
};

const Signin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mutation = useMutation<unknown, SigninError, FormData>({
    mutationFn: async (formData) => {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const result = await response.json();

      if (!response.ok || result.type === "error") throw result;
      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      router.replace("/");
      router.refresh();
    },
    onError: (error) => {
      const errors = error.fieldErrors || (error.element ? { [error.element]: error.message || "입력값을 확인해주세요." } : {});
      setFieldErrors(errors);

      if (Object.keys(errors).length === 0) {
        setFormError(error.message || "로그인 중 오류가 발생했습니다.");
      }
    },
  });

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    mutation.mutate(new FormData(event.currentTarget));
  };

  return (
    <div>
      <div>
        <p className="text-sm font-semibold text-[#16805b]">Welcome back</p>
        <h2 className="!mb-0 mt-3 !text-4xl font-semibold tracking-[-0.055em] text-[#073b2a] dark:text-white">로그인</h2>
        <p className="mt-3 text-sm leading-6 text-[#687c73] dark:text-[#a9b9b1]">계정 정보를 입력해 워크스페이스로 이동하세요.</p>
      </div>

      <form onSubmit={submit} className="mt-9 grid gap-5">
        {formError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {formError}
          </div>
        )}

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[#314a40] dark:text-[#d4ded9]">아이디</span>
          <span className={`flex h-13 items-center gap-3 rounded-xl border bg-white px-4 transition-all focus-within:border-[#16805b] focus-within:ring-4 focus-within:ring-[#16805b]/10 dark:bg-white/5 ${fieldErrors.accountId ? "border-red-400" : "border-[#073b2a]/15 dark:border-white/15"}`}>
            <UserRound size={18} className="shrink-0 text-[#789087]" />
            <input
              name="accountId"
              autoComplete="username"
              autoFocus
              placeholder="아이디를 입력하세요"
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9dafA7]"
            />
          </span>
          {fieldErrors.accountId && <span className="text-xs text-red-600">{fieldErrors.accountId}</span>}
        </label>

        <label className="grid gap-2">
          <span className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#314a40] dark:text-[#d4ded9]">비밀번호</span>
            <Link href="/auth/find" className="text-xs font-medium text-[#16805b] hover:underline">
              비밀번호 찾기
            </Link>
          </span>
          <span className={`flex h-13 items-center gap-3 rounded-xl border bg-white px-4 transition-all focus-within:border-[#16805b] focus-within:ring-4 focus-within:ring-[#16805b]/10 dark:bg-white/5 ${fieldErrors.password ? "border-red-400" : "border-[#073b2a]/15 dark:border-white/15"}`}>
            <LockKeyhole size={18} className="shrink-0 text-[#789087]" />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="비밀번호를 입력하세요"
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9dafA7]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              className="text-[#789087] hover:text-[#073b2a] dark:hover:text-white"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
          {fieldErrors.password && <span className="text-xs text-red-600">{fieldErrors.password}</span>}
        </label>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="group mt-1 flex h-13 items-center justify-center gap-2 rounded-xl bg-[#073b2a] text-sm font-semibold text-white shadow-[0_12px_28px_rgba(7,59,42,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#105941] disabled:cursor-wait disabled:opacity-60"
        >
          {mutation.isPending ? (
            <>
              <LoaderCircle size={17} className="animate-spin" />
              로그인 중
            </>
          ) : (
            <>
              로그인
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 border-t border-[#073b2a]/10 pt-6 text-center text-sm text-[#687c73] dark:border-white/10 dark:text-[#a9b9b1]">
        아직 계정이 없으신가요?{" "}
        <Link href="/auth/register" className="font-semibold text-[#16805b] hover:underline">
          회원가입
        </Link>
      </div>
    </div>
  );
};

export default Signin;
