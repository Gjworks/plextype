/**
 * @file Layout.js
 * @author 지제이웍스 (gjworks2@gmail.com)
 * @brief 레이아웃 최상위 파일
 **/
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Authpanel from "./AuthPanel";

const Layout = ({ children }) => {
  const pathname = usePathname();
  // useEffect(() => {
  //   const htmlElement = document.documentElement;
  //   // 조건에 따라 클래스를 추가 또는 제거
  //   if (!htmlElement.classList.contains("dark")) {
  //     htmlElement.classList.add("dark");
  //   }
  // }, []); //
  return (
    <>
      <div className="fixed inset-0 bg-[url('/assets/images/bg23.jpg')] bg-no-repeat bg-cover">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/40 via-gray-950/80 to-gray-950/95 dark:from-dark-950/40 dark:via-dark-950/80 dark:to-dark-950/95 z-10"></div>
      </div>
      <motion.div className="min-h-full">
        {/* <div className="absolute block top-0 left-0 right-0 h-[399px] bg-gradient-to-br from-dark-600 via-dark-800 to-dark-800"></div> */}
        <div className="relative z-20">
          <motion.main className="h-screen">
            <div className="h-full">
              <div className="h-full">
                <div className="relative lg:h-full">
                  <div className="relative w-full h-[320px] lg:h-full overflow-hidden">
                    <div className="absolute bottom-0 left-0 py-12 px-8 z-20">
                      <div className="text-white text-2xl lg:text-4xl font-medium mb-5">
                        Sign in & Sign up
                      </div>
                      <div className="text-gray-400 text-sm lg:text-base font-light">
                        회원가입을 하면 더욱 많은 서비스를 이용할 수 있습니다.
                      </div>
                    </div>
                  </div>
                  <div key={pathname}>
                    <Authpanel>{children}</Authpanel>
                  </div>
                </div>
              </div>
            </div>
          </motion.main>
        </div>
      </motion.div>
    </>
  );
};

export default Layout;
