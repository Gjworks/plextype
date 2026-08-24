"use client";

import Link from "next/link";
import { Bell, ChevronRight, Settings2, UserRound } from "lucide-react";

import HeaderUser from "@/modules/user/tpl/default/header";

const quickLinks = [
  {
    title: "회원 정보",
    description: "계정 표시 정보와 프로필을 관리합니다.",
    href: "/user/userUpdate",
    icon: <UserRound size={18} />,
  },
  {
    title: "개인 설정",
    description: "테마, 글자 크기, 알림 방식을 저장합니다.",
    href: "/user/preferences",
    icon: <Settings2 size={18} />,
  },
  {
    title: "알림센터",
    description: "내 계정으로 도착한 알림을 확인합니다.",
    href: "/user/notifications",
    icon: <Bell size={18} />,
  },
];

const IndexUser = () => {
  return (
    <>
      <HeaderUser />
      <main className="min-h-screen bg-white dark:bg-dark-950">
        <div className="mx-auto max-w-screen-lg px-4 py-10 md:py-14">
          <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-dark-800 dark:bg-dark-900">
            <div className="grid gap-0 md:grid-cols-[1.35fr_0.65fr]">
              <div className="p-7 md:p-10">
                <div className="text-xs uppercase tracking-[0.22em] text-gray-400 dark:text-dark-500">Account</div>
                <h1 className="mt-5 text-[30px] font-medium leading-tight tracking-[-0.045em] text-gray-950 dark:text-white md:text-[38px]">
                  계정의 기본 흐름을<br className="hidden sm:block" />
                  한 곳에서 관리합니다.
                </h1>
                <p className="mt-5 max-w-xl text-sm leading-7 text-gray-500 dark:text-dark-400">
                  회원 정보, 개인 설정, 알림을 기본 사용자 화면에서 조용하고 단순하게 확인합니다.
                </p>
              </div>
              <div className="border-t border-gray-200 bg-gray-50 p-7 dark:border-dark-800 dark:bg-dark-950/40 md:border-l md:border-t-0 md:p-8">
                <div className="flex h-full min-h-40 flex-col justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-950 text-white dark:bg-white dark:text-dark-950">
                    <UserRound size={22} />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-dark-500">Default skin</div>
                    <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-dark-400">
                      Plextype 기본 사용자 화면
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-4 grid gap-4 md:grid-cols-3">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_16px_36px_rgba(15,23,42,0.06)] dark:border-dark-800 dark:bg-dark-900 dark:hover:border-dark-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-700 transition-colors group-hover:bg-gray-950 group-hover:text-white dark:bg-dark-800 dark:text-dark-200 dark:group-hover:bg-white dark:group-hover:text-dark-950">
                    {item.icon}
                  </div>
                  <ChevronRight size={16} className="mt-1 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-gray-500 dark:text-dark-600 dark:group-hover:text-dark-300" />
                </div>
                <h2 className="mt-7 text-base font-medium tracking-[-0.025em] text-gray-950 dark:text-dark-100">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-dark-400">{item.description}</p>
              </Link>
            ))}
          </section>
        </div>
      </main>
    </>
  );
};

export default IndexUser;
