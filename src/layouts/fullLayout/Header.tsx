"use client";

import React, {useState, useEffect} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import Image from "next/image";

import Left from "@plextype/components/panel/Left";

import AccountDropwdown from "src/widgets/forms/AccountDropwdown";
import SideNav from "@plextype/components/nav/SideNav";
import nav from "@plextype/res/config/navigation.json";
import {motion} from "framer-motion";

import Right from "@plextype/components/panel/Right";
import MymenuTemplate from "src/widgets/forms/MymenuTemplate";
import {BellIcon, ChevronDownIcon} from "@heroicons/react/24/outline";

export type NavType = {
  name: string;
  icon: string;
  title: string;
  parent: string;
  route: string;
};

interface Inspage {
  route?: string;
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
      const page = params?.length > 2 ? '/' + params?.[2] : '/' + params?.[1];
      console.log(page)
      setCurrentPage({ route: page });
    }
  }, [pathname]);

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
      transition: {duration: 0.5, staggerChildren: 0.1},
    },
    closeSubMenu: {
      x: -25,
      opacity: 0,
      transition: {duration: 0.5, staggerChildren: 0.1, staggerDirection: -1},
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
        transition={{duration: 0.3}}
        className={
          "sticky bg-white/90 top-0 w-full  backdrop-blur-lg dark:bg-dark-950/95 z-20 " +
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
                    <div
                      className="absolute left-0 top-[6px] h-[1px] w-4 bg-black dark:bg-white transition-all group-hover:w-2"></div>
                    <div
                      className="absolute left-0 top-[12px] h-[1px] w-3 bg-black dark:bg-white transition-all group-hover:w-4"></div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowNavigation(!showNavigation)}
                className="group hidden items-center px-3"
              >
                <div className="relative flex h-5 w-5 cursor-pointer">
                  <span>
                    <div
                      className="absolute left-0 top-[3px] h-[1px] w-2 bg-black transition-all group-hover:w-3 dark:bg-white"></div>
                    <div
                      className="absolute left-0 top-[9px] h-[1px] w-4 bg-black transition-all group-hover:w-2 dark:bg-white"></div>
                    <div
                      className="absolute left-0 top-[15px] h-[1px] w-3 bg-black transition-all group-hover:w-4 dark:bg-white"></div>
                  </span>
                </div>
              </button>
              <div className="relative flex items-center">
                <div className="col-span-1 relative flex justify-center items-center gap-1">
                  <div className="group relative flex items-center gap-2">
                    <Link
                      href="/"
                      className="flex items-center justify-center p-[1.5px]"
                    >
                      <Image
                        src="/logo2.svg"
                        alt="gjworks logo"
                        width="16"
                        height="16"
                        className="block w-[1.25rem] h-[1.25rem]"
                      />
                      {/* <Image
                        src="/assets/images/brand/gjworks.svg"
                        alt="gjworks logo"
                        width="32"
                        height="32"
                        className="block dark:hidden lg:h-10 lg:w-10 h-8 w-8"
                      /> */}
                    </Link>
                    <div className="hidden group-hover:flex absolute top-10 lg:top-10 -left-1 z-10">
                      <div
                        className="bg-primary-500 text-white py-1 px-3 rounded-md text-xs after:w-3 after:h-3 after:rounded-sm after:absolute after:left-3.5 after:-top-1 after:bg-primary-500 after:inline-block after:rotate-45 after:content-[''] z-10 after:z-[-1]">
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
            <motion.div
              className="col-span-3 dark:before:bg-dark-700 group relative hidden items-center justify-center rounded-full py-1 md:flex">
              <div
                className=" relative flex gap-8"
                // onMouseEnter={() => setShowNavigation(true)} // 마우스엔터(호버)시 키값이 저장된다
                // onMouseLeave={} // 마우스리브 시에는 키값이 지워진다
              >
                {nav.header &&
                  Object.entries(nav.header).map((data, index) => {
                    return (
                      <div
                        key={data[1].name}
                        className="relative flex items-center gap-1"
                      >
                        <>
                          <Link
                            href={data[1].route}
                            className={
                              "relative  flex items-center gap-2 py-0 text-xs font-normal lg:py-2 md:text-[0.762rem] tracking-wider " +
                              (currentPage?.route === data[1].route
                                ? "text-gray-400 dark:text-white font-medium"
                                : "dark:text-dark-500 text-gray-950 hover:text-gray-600 dark:hover:text-white")
                            }
                          >
                            <div>{data[1].title}</div>
                            {data[1].subMenu.length > 0 ? (
                              <>
                                <div className="">
                                  <ChevronDownIcon className="size-3 storke-1"/>
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
                <div className="relative flex items-center">
                  <div
                    className="relative inline-block before:absolute h-[12px] before:-translate-y-1/2 before:h-12 w-[1px] before:top-0 before:left-0 bg-gray-300 before:block before:content-['']"></div>
                </div>
                <div>
                  <div className="relative flex items-start">
                    <Link
                      className={`relative flex items-center py-0 text-xs font-normal lg:py-2 md:text-[0.762rem] tracking-wider ` + (currentPage?.route === '/works'
                        ? "text-gray-400 dark:text-white font-medium"
                        : "dark:text-dark-500 text-gray-950 hover:text-gray-600 dark:hover:text-white")}
                      href="/works">
                      <div>Works</div>
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                             stroke="currentColor" className="size-4">
                          <path strokeLinecap="round" strokeLinejoin="round"
                                d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/>
                        </svg>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>

            </motion.div>
            <div className="relative col-span-1 flex items-center justify-end gap-2 md:gap-4">
              <div className="flex items-center">
                <button
                  className="px-2 py-2 text-gray-950 dark:text-dark-400 hover:bg-gray-100 rounded-md dark:hover:bg-dark-700/75 dark:hover:text-white"
                  // onClick={() => setShowModal(!showModal)}
                  onClick={() => setShowRight(true)}
                >
                  <BellIcon className="size-6 stroke-1"/>
                </button>
                <div className="">
                  <AccountDropwdown/>
                </div>
              </div>
              <button
                className="dark:text-dark-200 dark:bg-dark-900 relative hidden rounded-md bg-white px-2 py-1 text-gray-700 hover:bg-gray-200 hover:text-gray-900 dark:hover:text-white dark:hover:bg-dark-700/75"
                onClick={() => {
                }}
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
        initial={{opacity: 0, visibility: "hidden"}}
        animate={{
          opacity: subMenuState ? 1 : 0,
          visibility: subMenuState ? "visible" : "hidden",
        }}
        transition={{duration: 0.8}}
        exit={{
          opacity: 0,
          visibility: "hidden",
        }}
        className="fixed top-0 left-0 right-0 bottom-0 bg-gray-950/30 z-90 backdrop-blur-sm"
      ></motion.div>
      <Left state={showLeft} close={closeLeft} width="320px">
        <SideNav/>
      </Left>
      <Right state={showRight} close={closeRight}>
        <MymenuTemplate/>
      </Right>
    </>
  );
};

export default Header;
