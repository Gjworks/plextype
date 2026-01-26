"use client";

import Link from "next/link";
import Image from "next/image";
import {motion} from "framer-motion";
import React from "react";

const Page = () => {
  const parentVariants = {
    onscreen: {
      transition: {staggerChildren: 0.2},
    },
    offscreen: {
      transition: {staggerChildren: 0.2, staggerDirection: -1},
    },
  };
  const variants = {
    onscreen: {
      y: 0,
      opacity: [0, 1],
      transition: {
        duration: 0.4,
      },
    },
    offscreen: {
      y: 25,
      opacity: 0,
    },
  };
  return (
    <>
      <div className="hidden relative max-w-screen-2xl mx-auto px-3 h-full items-center justify-center w-full uppercase pt-16 pb-6">

      </div>
      <div className="relative flex items-center justify-center min-h-[calc(100vh-228px)] py-10">
        <div className="absolute inset-0 overflow-hidden">
          <div className="flex items-center justify-center h-full">
            <div className="text-black dark:text-white text-[11rem] lg:text-[13rem] xl:text-[16rem] 2xl:text-[18rem] font-bold uppercase rotate-90  sm:rotate-0 tracking-tight">Features</div>
          </div>
        </div>

        <div className="relative max-w-screen-2xl mx-auto px-3 h-full flex items-center justify-center w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 w-full">
            <div className="col-span-1">
              <div className="group bg-gray-200/80 dark:bg-dark-800 backdrop-blur-lg hover:bg-primary-500 hover:dark:bg-primary-500 rounded-2xl p-5 w-full h-[300px] transition duration-500 hover:scale-105  hover:shadow-lg hover:shadow-primary-900/40">
                <div className="flex flex-wrap flex-col h-full">
                  <div>
                    <div className="mb-8 group-hover:text-white dark:text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25}
                           stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
                      </svg>
                    </div>
                    <div className="group-hover:text-white text-black dark:text-white text-base font-semibold mb-1">README</div>
                    <div className="group-hover:text-primary-100 text-gray-600 text-xs dark:text-dark-400">
                      해당프로젝트에 대해서...
                    </div>
                  </div>
                  <div className="grow"></div>
                  <div className="">
                    <a href="https://github.com" target="_blank" className="flex items-center gap-1">
                      <div className="group-hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                             stroke="currentColor" className="size-4">
                          <path strokeLinecap="round" strokeLinejoin="round"
                                d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
                        </svg>

                      </div>
                      <div className="text-sm group-hover:text-white hover:underline">
                        github.com 가기
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-1">

            </div>
            <div className="col-span-1">

            </div>
            <div className="col-span-1">
              <div
                className="group bg-gray-200/80 dark:bg-dark-800 backdrop-blur-lg hover:bg-primary-500 hover:dark:bg-primary-500 rounded-2xl p-5 w-full h-[300px] transition duration-500 hover:scale-105  hover:shadow-lg hover:shadow-primary-900/40">
                <div className="mb-8 group-hover:text-white dark:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25}
                       stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
                  </svg>
                </div>
                <div className="group-hover:text-white text-black dark:text-white text-base font-semibold mb-1">INSTALLED</div>
                <div className="group-hover:text-primary-100 text-gray-600 text-xs dark:text-dark-400">
                  가져온 프로젝트를 이제 설치 할 차례입니다.
                </div>
              </div>
            </div>
            <div className="col-span-1">

            </div>

            <div className="col-span-1">
              <div className="group bg-gray-200/80 dark:bg-dark-800 backdrop-blur-lg hover:bg-primary-500 hover:dark:bg-primary-500 rounded-2xl p-5 w-full h-[300px] transition duration-500 hover:scale-105  hover:shadow-lg hover:shadow-primary-900/40">
                <div className="mb-8 group-hover:text-white dark:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25}
                       stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
                  </svg>
                </div>
                <div className="group-hover:text-white text-black dark:text-white text-base font-semibold mb-1">LIBRARY</div>
                <div className="group-hover:text-primary-100 text-gray-600 text-xs dark:text-dark-400">
                  해당 프로젝트의 라이브러리를 소개하는 페이지 입니다.
                </div>
              </div>
            </div>
            <div className="col-span-1">
              <div className="group bg-gray-200/80 dark:bg-dark-800 backdrop-blur-lg hover:bg-primary-500 hover:dark:bg-primary-500 rounded-2xl p-5 w-full h-[300px] transition duration-500 hover:scale-105  hover:shadow-lg hover:shadow-primary-900/40">
                <div className="mb-8 group-hover:text-white dark:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25}
                       stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
                  </svg>
                </div>
                <div className="group-hover:text-white text-black dark:text-white text-base font-semibold mb-1">COMPONENTS</div>
                <div className="group-hover:text-primary-100 text-gray-600 text-xs dark:text-dark-400">
                  Modal과 Dropdown 등 기본적인 Components의 문서입니다.
                </div>
              </div>
            </div>
            <div className="col-span-1">
              <div className="group bg-gray-200/80 dark:bg-dark-800 backdrop-blur-lg hover:bg-primary-500 hover:dark:bg-primary-500 rounded-2xl p-5 w-full h-[300px] transition duration-500 hover:scale-105  hover:shadow-lg hover:shadow-primary-900/40">
                <div className="mb-8 group-hover:text-white dark:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25}
                       stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
                  </svg>
                </div>
                <div className="group-hover:text-white text-black dark:text-white text-base font-semibold mb-1">TEMPLATES</div>
                <div className="group-hover:text-primary-100 text-gray-600 text-xs dark:text-dark-400">
                  Components와 기본 UI의 조합입니다.
                </div>
              </div>
            </div>
            <div className="col-span-1">

            </div>
            <div className="col-span-1">
              <div className="group bg-gray-200/80 dark:bg-dark-800 backdrop-blur-lg hover:bg-primary-500 hover:dark:bg-primary-500 rounded-2xl p-5 w-full h-[300px] transition duration-500 hover:scale-105  hover:shadow-lg hover:shadow-primary-900/40">
                <div className="mb-8 group-hover:text-white dark:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25}
                       stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
                  </svg>
                </div>
                <div className="group-hover:text-white text-black dark:text-white text-base font-semibold mb-1 uppercase">maintenance</div>
                <div className="group-hover:text-primary-100 text-gray-600 text-xs dark:text-dark-400">
                  유지보수 항목에 대해 소개해드립니다.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
