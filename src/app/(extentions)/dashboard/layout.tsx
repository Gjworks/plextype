"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

import DefaultNav from "@plextype/components/nav/DefaultNav";

import "styles/globals.css";

import nav from "@plextype/res/config/settings.json";
import {
  HomeIcon,
  ChatBubbleBottomCenterTextIcon,
  BellIcon,
  ArchiveBoxIcon,
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

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
                <HomeIcon className="size-5 text-white stroke-1" />
              </div>
              <div className="flex items-center text-white mr-3">홈 페이지</div>
            </Link>
            <div className="flex-1"></div>
            <div className="flex items-center px-3">
              <div className="max-w-xl flex items-center rounded-full bg-gray-700/75 backdrop-blur-lg px-3 text-white">
                <MagnifyingGlassIcon className="size-5 text-white stroke-1.5" />
                <input
                  type="text"
                  className="bg-transparent text-white py-2 outline-none px-3 text-sm w-full"
                />
              </div>
            </div>
            <div className="flex gap-4 px-3">
              <div className="flex items-center text-gray-300 hover:text-white">
                <ChatBubbleBottomCenterTextIcon className="size-5 stroke-1.5" />
              </div>
              <div className="flex items-center text-gray-300 hover:text-white">
                <BellIcon className="size-5 stroke-1.5" />
              </div>
              <div className="flex items-center text-gray-300 hover:text-white">
                <ArchiveBoxIcon className="size-5 stroke-1.5" />
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
                  <EllipsisHorizontalIcon className="size-5" />
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
                <DefaultNav list={dashbaordNav} params={params[2]} />
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
