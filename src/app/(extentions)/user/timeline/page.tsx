"use client";

import Image from "next/image";

const Page = () => {
  return (
    <>
      <div className="">
        <div className="max-w-screen-sm mx-auto px-3 pt-10 pb-20">
          <div className="">
            <div className="py-3 relative before:absolute before:left-8 before:w-1 before:h-full before:bg-gray-200 dark:before:bg-dark-800 before:top-0">
              <div className="relative w-full rounded-xl border border-gray-200/75 bg-gray-100 p-5 shadow-lg shadow-gray-100/90 backdrop-blur-xl dark:bg-dark-800 dark:border-dark-700 dark:shadow-dark-900/70"></div>
            </div>

            <div className="py-3 relative before:absolute before:left-8 before:w-1 before:h-full before:bg-gray-200 dark:before:bg-dark-800 before:top-0">
              <div className="relative w-full rounded-xl border border-gray-200/75 bg-gray-100 dark:bg-dark-800 dark:border-dark-700 dark:shadow-dark-900/70 p-5 shadow-lg shadow-gray-100/90 backdrop-blur-xl">
                <div className="flex gap-8">
                  <div className="rounded-lg bg-white w-12 h-12 flex items-center justify-center text-gray-600 shadow shadow-gray-200">
                    <div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-base dark:text-white mb-3">
                      Alien: River of Pain Revisions 2.0
                    </div>
                    <div className="line-clamp-2 text-sm text-gray-400">
                      Authentication verifies a users identity. This happens
                      when a user logs in, either with a username and password
                      or through a
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative pl-16 pt-5">
                <div className="flex text-gray-400 text-sm after:w-4 after:h-4 after:absolute after:rounded-full after:left-[26px] after:bg-transparent after:bg-gray-300 ">
                  <div className="flex items-center gap-2">
                    <div>해당문서가</div>
                    <div className="font-bold">지제이웍스</div>
                    <div>에 의하여</div>
                    <div>
                      <span className="bg-rose py-0.5 px-4 rounded-full  bg-rose-500 text-xs text-white">
                        삭제
                      </span>
                    </div>
                    <div>처리 되었습니다. 12시간전</div>
                  </div>
                </div>
              </div>
              <div className="relative pl-16 pt-5">
                <div className="flex text-gray-400 text-sm after:w-4 after:h-4 after:absolute after:rounded-full after:left-[26px] after:bg-transparent after:bg-gray-300 ">
                  <div className="flex items-center gap-2">
                    <div>해당문서가</div>
                    <div className="font-bold">지제이웍스</div>
                    <div>에 의하여</div>
                    <div>
                      <span className="bg-rose py-0.5 px-4 rounded-full  bg-cyan-500 text-xs text-white">
                        오픈
                      </span>
                    </div>
                    <div>처리 되었습니다. 17일전</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pb-3 pt-12 relative before:absolute before:left-8 before:w-1 before:h-full before:bg-gray-200 dark:before:bg-dark-800 before:top-0">
              <div className="flex justify-center">
                <div className="flex items-center gap-2 justify-center text-sm text-gray-400 hover:text-gray-900 hover:border-gray-700 w-36 relative rounded-xl border border-gray-200/75 bg-white dark:bg-dark-900 dark:border-dark-700 dark:hover:text-white py-2 px-5 cursor-pointer">
                  <div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25"
                      />
                    </svg>
                  </div>
                  <div>more</div>
                </div>
              </div>
            </div>

            <div className="hidden bg-white overflow-hidden shadow shadow-gray-200 rounded-2xl">
              <div className="flex gap-4 p-3 border border-gray-100 rounded-t-2xl">
                <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                <div className="flex-1">
                  <div className="text-sm ">지제이웍스</div>
                  <div className="text-gray-400 text-xs">4일전</div>
                </div>
              </div>
              <div className="">
                <Image
                  src="/assets/images/bg11.jpg"
                  width={560}
                  height={320}
                  alt="thumb"
                />
              </div>
              <div className="border-l border-b border-r border-gray-100 rounded-b-2xl">
                <div className="px-4 py-5 text-sm text-gray-400">
                  <div className="line-clamp-2">
                    Authentication verifies a users identity. This happens when
                    a user logs in, either with a username and password or
                    through a
                  </div>
                </div>
                <div className="flex gap-4 pt-3 pb-3 border-t border-gray-100">
                  <div className="flex-1 flex justify-center">
                    <div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.25}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.25}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 flex justify-center"></div>
                </div>
                <div className="bg-gray-100 p-5"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Page;
