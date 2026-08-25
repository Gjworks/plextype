"use client";

import Link from "next/link";
import { ArrowLeft, Check, Leaf } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
  siteUrl?: string;
  siteTitle?: string;
};

const AuthLayout = ({ children, siteUrl = "/", siteTitle = "Plextype" }: AuthLayoutProps) => {
  const router = useRouter();
  const displayTitle = siteTitle || "Plextype";

  return (
    <main className="min-h-screen bg-white text-[#10251d] dark:bg-[#07120e] dark:text-white">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(520px,0.78fr)]">
        <section className="relative hidden overflow-hidden bg-[#073b2a] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
          <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
          <Link href={siteUrl || "/"} className="relative z-10 inline-flex w-fit items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#073b2a]">
              <Leaf size={19} />
            </span>
            <span className="text-lg font-semibold tracking-[-0.04em]">{displayTitle}</span>
          </Link>

          <div className="relative z-10 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7ed5ae]">Your workspace, secured</p>
            <h1 className="!mb-0 mt-6 !text-5xl font-semibold !leading-[1.08] tracking-[-0.06em] xl:!text-6xl">
              다시 만나서
              <br />
              반갑습니다.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/58">
              콘텐츠와 사용자를 관리하고, 서비스의 다음 단계를 이어가세요.
            </p>
            <div className="mt-10 grid gap-4 text-sm text-white/72">
              {["안전한 쿠키 기반 인증", "역할과 권한에 따른 접근", "하나로 연결된 운영 환경"].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[#8de0b9]">
                    <Check size={13} />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-xs text-white/35">
            © {new Date().getFullYear()} {displayTitle}
          </p>
        </section>

        <section className="flex min-h-screen flex-col bg-white dark:bg-[#07120e]">
          <header className="flex h-20 items-center justify-between px-5 sm:px-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#64786f] transition-colors hover:bg-[#f0f7f3] hover:text-[#073b2a] dark:text-[#a9b9b1] dark:hover:bg-white/10 dark:hover:text-white"
            >
              <ArrowLeft size={16} />
              뒤로
            </button>
            <Link href={siteUrl || "/"} className="inline-flex items-center gap-2 font-semibold tracking-[-0.03em] lg:hidden">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#073b2a] text-white">
                <Leaf size={15} />
              </span>
              {displayTitle}
            </Link>
          </header>
          <div className="flex flex-1 items-center justify-center px-5 pb-20 pt-8 sm:px-8">
            <div className="w-full max-w-[430px]">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AuthLayout;
