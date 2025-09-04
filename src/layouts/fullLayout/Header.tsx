"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

import Left from "@plextype/components/panel/Left";

import AccountDropwdown from "src/widgets/forms/AccountDropwdown";
import SideNav from "@plextype/components/nav/SideNav";
import nav from "@plextype/res/config/navigation.json";
import { motion } from "framer-motion";

import Right from "@plextype/components/panel/Right";
import MymenuTemplate from "src/widgets/forms/MymenuTemplate";
import { BellIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

export type NavType = {
  name: string;
  icon: string;
  title: string;
  parent: string;
  route: string;
};

interface Inspage {
  name: string;
  title: string;
  parent: string;
  route: string;
}

const Header = () => {
  const pathname = usePathname();

  const [showLeft, setShowLeft] = useState(false);
  const [subMenuState, setSubMenuState] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [currentPage, setCurrentPage] = useState<Inspage | undefined>();
  const [showRight, setShowRight] = useState(false);

  const closeRight = (close) => {
    setShowRight(close);
  };

  useEffect(() => {
    const params = pathname?.split("/");

    if (params?.length) {
      if (params?.length > 2) {
        setCurrentPage(nav.header[params?.[2]]);
      } else {
        setCurrentPage(nav.header[params?.[1]]);
      }
      // setCurrentPage(nav.header[params?.[1]])
    }
  }, [pathname, currentPage]);

  const closeLeft = (close) => {
    setShowLeft(close);
  };
  const handleClickOutside = () => {
    setShowNavigation(false);
    setSubMenuState(false);
  };
  useEffect(() => {
    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, []);

  const handleMouseEnter = () => {
    setSubMenuState(true);
  };
  const variants = {
    openSubMenu: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 },
    },
    closeSubMenu: {
      x: -25,
      opacity: 0,
      transition: { duration: 0.5, staggerChildren: 0.1, staggerDirection: -1 },
    },
  };

  const variants2 = {
    openSubMenu: {
      x: 0,
      opacity: [0, 1],
      transition: {
        duration: 0.4,
      },
    },
    closeSubMenu: {
      x: -25,
      opacity: 0,
    },
  };

  return (
    <>
      <motion.header
        transition={{ duration: 0.3 }}
        className={
          "relative top-0 w-full  backdrop-blur-lg dark:bg-dark-950/95 z-20 " +
          (showNavigation ? "  " : " ")
        }
      >
        <div className="max-w-screen-xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-3 py-2">
            <div className="relative col-span-1 flex justify-start">
              <button
                onClick={() => {
                  setShowLeft(!showLeft);
                }}
                className="group flex md:hidden items-center px-2"
              >
                <div className="relative flex h-5 w-5 cursor-pointer">
                  <div className="z-50">
                    {/* <div className="transition-all absolute left-0 top-[3px] h-[1px] w-2 group-hover:w-3 bg-black dark:bg-white"></div> */}
                    <div className="absolute left-0 top-[6px] h-[1px] w-4 bg-black dark:bg-white transition-all group-hover:w-2"></div>
                    <div className="absolute left-0 top-[12px] h-[1px] w-3 bg-black dark:bg-white transition-all group-hover:w-4"></div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowNavigation(!showNavigation)}
                className="group hidden items-center px-3"
              >
                <div className="relative flex h-5 w-5 cursor-pointer">
                  <span>
                    <div className="absolute left-0 top-[3px] h-[1px] w-2 bg-black transition-all group-hover:w-3 dark:bg-white"></div>
                    <div className="absolute left-0 top-[9px] h-[1px] w-4 bg-black transition-all group-hover:w-2 dark:bg-white"></div>
                    <div className="absolute left-0 top-[15px] h-[1px] w-3 bg-black transition-all group-hover:w-4 dark:bg-white"></div>
                  </span>
                </div>
              </button>
              <div className="relative flex items-center">
                <div className="col-span-1 relative flex justify-center items-center gap-1">
                  <div className="group relative flex items-center gap-2">
                    <Link
                      href="/"
                      className="hidden items-center justify-center p-[1.5px]"
                    >
                      {/*<Image*/}
                      {/*  src="/logo2.svg"*/}
                      {/*  alt="gjworks logo"*/}
                      {/*  width="16"*/}
                      {/*  height="16"*/}
                      {/*  className="block w-[1.25rem] h-[1.25rem]"*/}
                      {/*/>*/}
                      <svg
                        width="35"
                        height="33"
                        viewBox="0 0 35 33"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="fill-primary max-w-full [&amp;&gt;path]:hidden [&amp;&gt;#mark]:block [&amp;&gt;#furigana]:opacity-60 [&amp;&gt;#subtitle]:opacity-60 sm:[&amp;&gt;path]:hidden w-[1.75rem] h-[1.75rem]"
                      >
                        <path
                          d="M13.2371 21.0407L24.3186 12.8506C24.8619 12.4491 25.6384 12.6057 25.8973 13.2294C27.2597 16.5185 26.651 20.4712 23.9403 23.1851C21.2297 25.8989 17.4581 26.4941 14.0108 25.1386L10.2449 26.8843C15.6463 30.5806 22.2053 29.6665 26.304 25.5601C29.5551 22.3051 30.562 17.8683 29.6205 13.8673L29.629 13.8758C28.2637 7.99809 29.9647 5.64871 33.449 0.844576C33.5314 0.730667 33.6139 0.616757 33.6964 0.5L29.1113 5.09055V5.07631L13.2343 21.0436"
                          fill="currentColor"
                          id="mark"
                        ></path>
                        <path
                          d="M10.9503 23.0313C7.07343 19.3235 7.74185 13.5853 11.0498 10.2763C13.4959 7.82722 17.5036 6.82767 21.0021 8.2971L24.7595 6.55998C24.0826 6.07017 23.215 5.54334 22.2195 5.17313C17.7198 3.31926 12.3326 4.24192 8.67479 7.90126C5.15635 11.4239 4.0499 16.8403 5.94992 21.4622C7.36924 24.9165 5.04257 27.3598 2.69884 29.826C1.86829 30.7002 1.0349 31.5745 0.36364 32.5L10.9474 23.0341"
                          fill="currentColor"
                          id="mark"
                        ></path>
                      </svg>
                      {/* <Image
                        src="/assets/images/brand/gjworks.svg"
                        alt="gjworks logo"
                        width="32"
                        height="32"
                        className="block dark:hidden lg:h-10 lg:w-10 h-8 w-8"
                      /> */}
                    </Link>
                    <div className="hidden group-hover:flex absolute top-10 lg:top-10 -left-1 z-10">
                      <div className="bg-primary-500 text-white py-1 px-3 rounded-md text-xs after:w-3 after:h-3 after:rounded-sm after:absolute after:left-3.5 after:-top-1 after:bg-primary-500 after:inline-block after:rotate-45 after:content-[''] z-10 after:z-[-1]">
                        2.0
                      </div>
                    </div>
                    <a
                      href={process.env.NEXT_PUBLIC_DEFAULT_URL}
                      className="flex md:flex items-center"
                    >
                      <div className="flex text-sm font-semibold md:text-[0.913rem]">
                        <div className="text-black dark:text-white">
                          지제이웍스
                        </div>
                      </div>
                    </a>
                    <Link
                      href="/plextype"
                      className="hidden dark:text-dark-100 dark:bg-dark-100/10 cursor-pointer rounded-full bg-gray-200/90 px-4 py-1 text-xs text-gray-500 backdrop-blur-lg transition duration-300 hover:bg-gray-200/75 hover:text-black dark:hover:bg-gray-100/20 dark:hover:text-white"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1}
                        stroke="currentColor"
                        className="mr-2 h-4 w-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46"
                        />
                      </svg>
                      <span>Plextype 0.1.10.beta</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <motion.div className="col-span-3 dark:before:bg-dark-700 group relative hidden items-center justify-center rounded-full py-1 md:flex">
              <div
                className=" relative flex"
                // onMouseEnter={() => setShowNavigation(true)} // 마우스엔터(호버)시 키값이 저장된다
                // onMouseLeave={} // 마우스리브 시에는 키값이 지워진다
              >
                {nav.header &&
                  Object.entries(nav.header).map((data, index) => {
                    return (
                      <div
                        key={data[1].name}
                        className="relative flex items-center"
                      >
                        <>
                          <Link
                            href={data[1].route}
                            className={
                              "relative mx-2 flex items-center gap-2 px-1 py-0 text-xs font-normal lg:px-3 lg:py-2 md:text-[0.762rem] tracking-wider " +
                              (currentPage?.route === data[1].route
                                ? "text-gray-500 dark:text-white font-medium"
                                : "dark:text-dark-500 text-gray-950 hover:text-gray-600 dark:hover:text-white")
                            }
                          >
                            <div>{data[1].title}</div>
                            {data[1].subMenu.length > 0 ? (
                              <>
                                <div className="">
                                  <ChevronDownIcon className="size-3 storke-1" />
                                </div>
                              </>
                            ) : (
                              ""
                            )}
                          </Link>
                        </>
                      </div>
                    );
                  })}
                <button
                  onClick={() => {
                    setShowNavigation(true);
                  }}
                  className="hidden items-center rounded-md px-3 hover:bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25"
                    />
                  </svg>
                </button>
              </div>
            </motion.div>
            <div className="relative col-span-1 flex items-center justify-end gap-2 md:gap-4">
              <div className="flex items-center">
                <button
                  className="px-2 py-2 text-gray-950 dark:text-dark-400 hover:bg-gray-100 rounded-md dark:hover:bg-dark-700/75 dark:hover:text-white"
                  // onClick={() => setShowModal(!showModal)}
                  onClick={() => setShowRight(true)}
                >
                  <BellIcon className="size-6 stroke-1" />
                </button>
                <div className="">
                  <AccountDropwdown />
                </div>
              </div>
              <button
                className="dark:text-dark-200 dark:bg-dark-900 relative hidden rounded-md bg-white px-2 py-1 text-gray-700 hover:bg-gray-200 hover:text-gray-900 dark:hover:text-white dark:hover:bg-dark-700/75"
                onClick={() => {}}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                  />
                </svg>
                <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-600 dark:bg-rose-600"></div>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, visibility: "hidden" }}
        animate={{
          opacity: subMenuState ? 1 : 0,
          visibility: subMenuState ? "visible" : "hidden",
        }}
        transition={{ duration: 0.8 }}
        exit={{
          opacity: 0,
          visibility: "hidden",
        }}
        className="fixed top-0 left-0 right-0 bottom-0 bg-gray-950/30 z-90 backdrop-blur-sm"
      ></motion.div>
      <Left state={showLeft} close={closeLeft} width="320px">
        <SideNav />
      </Left>
      <Right state={showRight} close={closeRight}>
        <MymenuTemplate />
      </Right>
    </>
  );
};

export default Header;
