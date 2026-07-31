"use client";

import Link from "next/link";
import { Building2, ShieldCheck } from "lucide-react";
import React from "react";

const AuthLayout = ({
  children,
  siteUrl,
  siteTitle = "Plextype",
}: {
  children: React.ReactNode;
  siteUrl?: string;
  siteTitle?: string;
}) => {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#eef0ec] px-4 py-8 text-gray-950 dark:bg-[#050505] dark:text-white sm:px-6 lg:px-10">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[52vh] bg-black dark:bg-[#020202]" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[52vh] bg-[#eef0ec] dark:bg-[#090909]" />
      <div aria-hidden="true" className="absolute left-1/2 top-[46vh] h-[32rem] w-[72rem] -translate-x-1/2 rounded-full bg-white/70 blur-3xl dark:bg-white/[0.035]" />
      <div aria-hidden="true" className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-black/[0.035] blur-3xl dark:bg-white/[0.025]" />
      <div aria-hidden="true" className="absolute -right-24 top-20 h-96 w-96 rounded-full bg-white/10 blur-3xl dark:bg-white/[0.035]" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1080px] overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-2xl shadow-black/20 dark:border-white/10 dark:bg-black dark:shadow-black/60 lg:grid-cols-[1.06fr_0.94fr]">
        <section className="relative hidden overflow-hidden bg-black text-white lg:block">
          <div className="pointer-events-none absolute -right-[118px] -top-[116px] h-[324px] w-[324px] rounded-full border-[58px] border-white/[0.105]" />
          <div className="absolute bottom-0 left-0 h-72 w-72 translate-y-1/2 rounded-full bg-white/[0.04] blur-2xl" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-white/[0.06] to-transparent" />
          <div className="relative flex h-full min-h-[720px] flex-col justify-between px-[68px] py-[58px] xl:px-[74px] xl:py-[64px]">
            {siteUrl && (
              <Link href={siteUrl} className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center text-white">
                  <Building2 size={24} strokeWidth={1.8} />
                </span>
                <span>
                  <span className="block text-[11px] font-medium uppercase tracking-[0.28em] text-white/55">
                    Plextype
                  </span>
                  <span className="mt-1 block text-sm font-semibold tracking-[-0.02em]">
                    {siteTitle}
                  </span>
                </span>
              </Link>
            )}

            <div className="max-w-md">
              <div className="mb-5 text-[12px] font-medium uppercase tracking-[0.18em] text-white/55">
                Content Management
              </div>
              <h1 className="text-[42px] font-semibold leading-tight tracking-[-0.04em]">
                확장을 위한 조용한 기본 공간
              </h1>
              <p className="mt-7 text-sm leading-7 tracking-[-0.02em] text-white/60">
                코어는 단단하게 유지하고, 프로젝트별 화면과 기능은 extensions에서 유연하게 조립합니다.
              </p>
            </div>

            <div className="grid gap-3 text-[13px] text-white/55">
              <div className="flex items-center gap-3">
                <ShieldCheck size={17} className="text-white/75" />
                Cookie based authentication
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck size={17} className="text-white/75" />
                Core clean, extensions first
              </div>
              <div className="pt-10 text-[11px] text-white/35">Copyright Plextype. All rights reserved.</div>
            </div>
          </div>
        </section>

        <section className="flex min-h-[720px] flex-col bg-white dark:bg-[#050505]">
          <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
            <div className="w-full max-w-[520px]">
              <div className="mb-10 lg:hidden">
                {siteUrl && (
                  <Link href={siteUrl} className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-black text-xs font-bold text-white dark:bg-white dark:text-black">
                      {siteTitle.trim().charAt(0).toUpperCase() || "P"}
                    </span>
                    <span className="text-sm font-semibold">{siteTitle}</span>
                  </Link>
                )}
              </div>
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AuthLayout;
