"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const Footer = () => {
  const variants = {
    onscreen: {
      opacity: [0, 1],
      transition: {
        staggerChildren: 0.1,
      },
    },
    offscreen: {
      opacity: 0,
      transition: {
        staggerChildren: 0.1,
        staggerDirection: -1,
      },
    },
  };
  const parentVariants = {
    onscreen: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
      },
    },
    offscreen: {
      y: 15,
      opacity: 0,
      transition: {
        duration: 0.3,
      },
    },
  };
  return (
    <>
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6 flex flex-wrap gap-8 px-3 pt-6">
          <motion.div
            variants={variants}
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: false, amount: 0.3 }}
            className="lg:order-0 order-1 flex w-full flex-wrap gap-4 lg:flex-1"
          >
            <motion.div className="flex w-full flex-wrap items-center gap-1 lg:gap-4">
              <motion.div
                variants={parentVariants}
                className="flex w-full items-center text-xs text-black lg:w-16 dark:text-white"
              >
                Partners
              </motion.div>
              <motion.div className="col-span-3 flex items-center lg:col-span-1">
                <div className="flex gap-4">
                  <motion.div variants={parentVariants} className="">
                    <Link
                      href="/"
                      className="dark:text-dark-400 text-xs text-gray-400 hover:text-black dark:hover:text-white"
                    >
                      파트너 센터
                    </Link>
                  </motion.div>
                  <motion.div variants={parentVariants} className="">
                    <Link
                      href="/"
                      className="dark:text-dark-400 text-xs text-gray-400 hover:text-black dark:hover:text-white"
                    >
                      파트너 신청
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
            <div className="flex w-full flex-wrap gap-1 lg:gap-4">
              <motion.div
                variants={parentVariants}
                className="flex w-full items-center text-xs text-black lg:w-16 dark:text-white"
              >
                Developer
              </motion.div>
              <motion.div className="col-span-3 flex items-center lg:col-span-1">
                <div className="flex flex-wrap gap-4">
                  <motion.div variants={parentVariants}>
                    <Link
                      href="/"
                      className="dark:text-dark-400 text-xs text-gray-400 hover:text-black dark:hover:text-white"
                    >
                      Documentation
                    </Link>
                  </motion.div>
                  <motion.div variants={parentVariants}>
                    <Link
                      href="/"
                      className="dark:text-dark-400 text-xs text-gray-400 hover:text-black dark:hover:text-white"
                    >
                      구매내역
                    </Link>
                  </motion.div>
                  <motion.div variants={parentVariants}>
                    <Link
                      href="/"
                      className="dark:text-dark-400 text-xs text-gray-400 hover:text-black dark:hover:text-white"
                    >
                      스토어
                    </Link>
                  </motion.div>
                  <motion.div variants={parentVariants}>
                    <Link
                      href="/"
                      className="dark:text-dark-400 text-xs text-gray-400 hover:text-black dark:hover:text-white"
                    >
                      License
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
          <motion.div
            variants={variants}
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: false, amount: 0.3 }}
            className="order-0 flex items-center gap-4 lg:order-1"
          >
            <motion.a
              href="https://github.com/Gjworks"
              target="_blank"
              className="group flex flex-1 cursor-pointer justify-center"
            >
              <motion.div variants={parentVariants} className="px-1">
                <svg className="w-5 h-5 fill-current text-gray-800" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>GitHub</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              </motion.div>
            </motion.a>
            <motion.a
              href="https://x.com/gjworks2"
              target="_blank"
              className="group flex flex-1 cursor-pointer justify-center"
            >
              <motion.div variants={parentVariants} className="px-1">
                <svg className="w-5 h-5 fill-current text-gray-800" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>X</title><path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/></svg>
              </motion.div>
            </motion.a>
          </motion.div>
        </div>
        {/* <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200/75 dark:via-dark-700 to-transparent"></div> */}
        <div className="relative">
          <div className="block-line-t">
            <motion.div
              variants={variants}
              initial="offscreen"
              whileInView="onscreen"
              viewport={{ once: false, amount: 0.3 }}
              className="flex flex-wrap justify-center gap-8 pt-3 pb-6"
            >
              <motion.div className="flex items-center lg:justify-end">
                <div className="flex flex-wrap justify-center gap-4 lg:gap-8">
                  <motion.div
                    className="order-4 flex w-full items-center justify-center md:order-1 md:pt-0 lg:w-auto"
                    variants={parentVariants}
                  >
                    <div className="dark:text-dark-200 text-center text-xs text-gray-950 lg:text-left pt-1">
                      ⓒ 지제이웍스
                    </div>
                  </motion.div>
                  <motion.div
                    variants={parentVariants}
                    className="order-1 md:order-2"
                  >
                    <Link
                      href="/about"
                      className="dark:text-dark-400 text-xs text-gray-400 hover:text-gray-950 dark:hover:text-white hover:underline"
                    >
                      ABOUT
                    </Link>
                  </motion.div>
                  <motion.div
                    variants={parentVariants}
                    className="order-2 md:order-3"
                  >
                    <Link
                      href="/terms"
                      className="dark:text-dark-400 text-xs text-gray-400 hover:text-gray-950 dark:hover:text-white hover:underline"
                    >
                      Terms of service
                    </Link>
                  </motion.div>
                  <motion.div
                    variants={parentVariants}
                    className="order-3 md:order-4"
                  >
                    <Link
                      href="/privacy"
                      className="dark:text-dark-400 text-xs text-gray-400 hover:text-gray-950 dark:hover:text-white hover:underline"
                    >
                      Privacy policy
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Footer;
