"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import DefaultNav from "@plextype/components/nav/DefaultNav";

import "@/app/globals.css";

import nav from "@plextype/res/config/settings.json";

export default function DashboardLayout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [dashbaordNav, setDashboardNav] = useState<object>([]);
  const [title, setTitle] = useState<string>("");
  const [params, setParams] = useState<any[]>([]);

  useEffect(() => {
    const htmlElement = document.documentElement;
    if (htmlElement.classList.contains("dark")) {
      htmlElement.classList.remove("dark");
    }
  }, []); // 빈 배열을 두 번째 인수로 전달하면 컴포넌트가 처음 마운트될 때만 실행됩니다.

  useEffect(() => {
    const params = pathname?.split("/");
    setParams(params);
    Object.entries(nav.navigation).map((item, index) => {
      if (item[0] === params[2]) {
        setDashboardNav(item[1].subMenu);
        setTitle(item[1].title);
      }
      if (!params[2]) {
        setDashboardNav([]);
        setTitle("");
      }
    });
  }, [pathname]);

  useEffect(() => {
    console.log(params);
  }, [params]);

  return (
    <div className="selection:text-white selection:bg-orange-500 min-h-screen">
      <div className="h-full">
        <div className="fixed w-full top-0 bg-gray-950/90 dark:bg-dark-950/90 backdrop-blur-lg h-[60px] z-101">
          <div className="flex">
            <Link href="/" className="flex gap-4 items-center px-3">
              <div className="flex items-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>

              </div>
              <div className="flex items-center text-white mr-3">홈 페이지</div>
            </Link>
            <div className="flex-1"></div>
            <div className="flex items-center px-3">
              <div className="max-w-xl flex items-center rounded-full bg-gray-700/75 backdrop-blur-lg px-3 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>

                <input
                  type="text"
                  className="bg-transparent text-white py-2 outline-none px-3 text-sm w-full"
                />
              </div>
            </div>
            <div className="flex gap-4 px-3">
              <div className="flex items-center text-gray-300 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>

              </div>
              <div className="flex items-center text-gray-300 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
              </div>
              <div className="flex items-center text-gray-300 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>

              </div>
            </div>
            <div className="flex items-center py-3 bg-gray-600/25 backdrop-blur-lg px-5">
              <div className="rounded-full w-8 h-8 bg-gray-500"></div>
              <div className="px-2">
                <div className="text-white text-sm">Jhon Kury</div>
                <div className="text-xs text-gray-300">CEO Business</div>
              </div>
            </div>
          </div>
        </div>
        <div className="h-[60px]"></div>
        <div className="fixed w-[300px] backdrop-blur-lg h-screen overflow-hidden overflow-y-auto border-r border-slate-200 dark:border-dark-600">
          <div className="py-6 px-5">
            <div className="">
              <div className="flex items-center mb-1">
                <Link
                  href="/dashboard"
                  className="flex flex-1 text-black dark:text-white text-xl font-semibold"
                >
                  Dashboard
                </Link>
                <div className="px-3">
                  <div className="rounded-full w-2 h-2 bg-lime-400"></div>
                </div>
                <div className="text-black dark:text-dark-400 cursor-pointer border border-slate-200 dark:border-dark-700 rounded-md py-1 px-2 hover:bg-slate-200/25 dark:hover:bg-gray-800/25">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                  </svg>

                </div>
              </div>
              <div className="text-gray-500 text-xs">Dashboard 홈으로 가기</div>
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-dark-600"></div>
          <div className="py-6 px-5">
            <div className="">
              <div className="text-xs text-gray-400/75 font-semibold mb-5">
                관리기능
              </div>
              {nav.navigation &&
                Object.entries(nav.navigation).map((item, index) => {
                  return (
                    <div key={index} className="mb-1">
                      <>
                        <Link
                          href={item[1].route}
                          className={
                            "flex gap-4 text-sm py-2.5 rounded " +
                            (item[1].name === params[2]
                              ? " bg-cyan-500 text-white hover:text-white hover:bg-cyan-600 "
                              : " hover:text-gray-950 hover:bg-gray-200 dark:text-dark-400 dark:hover:text-white dark:hover:bg-dark-700 ")
                          }
                        >
                          <div></div>
                          <div className="px-3">{item[1].title}</div>
                        </Link>
                      </>
                    </div>
                  );
                })}
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-dark-600"></div>
          <div className="py-6 px-5">
            <div className="text-xs text-gray-400/75 font-semibold mb-5">
              최근활동 회원
            </div>
            <div className="">
              <div className="px-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="text-sm text-gray-500">지제이웍스</div>
                </div>
              </div>
              <div className="px-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="text-sm text-gray-500">맥도날드와버거킹</div>
                </div>
              </div>
              <div className="px-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="text-sm text-gray-500">나이트크로우</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative top-0 ml-[300px]">
          <div className="relative">
            {title && (
              <div className=" pt-10">
                <div className="max-w-screen-2xl mx-auto px-3">
                  <div className="">
                    <div className="flex flex-wrap items-center gap-4 mb-5">
                      <div className="text-black dark:text-white text-2xl font-semibold">
                        {title}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="sticky top-[52px] lg:top-[60px] w-full bg-white/90 dark:bg-dark-950/90 backdrop-blur-lg z-90 border-b border-gray-100 dark:border-dark-700">
              <div className="overflow-scroll-hide overflow-hidden overflow-x-auto flex gap-8 max-w-screen-2xl mx-auto px-3">
                <DefaultNav list={dashbaordNav} />
              </div>
            </div>
            <div className="">
              <div className="">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
