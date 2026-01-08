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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="dark:fill-dark-400 dark:group-hover:fill-dark-100 h-6 w-6 fill-gray-900 stroke-1 group-hover:fill-gray-700"
                  width="512"
                  height="512"
                  viewBox="0 0 512 512"
                >
                  <title>ionicons-v5_logos</title>
                  <path d="M256,32C132.3,32,32,134.9,32,261.7c0,101.5,64.2,187.5,153.2,217.9a17.56,17.56,0,0,0,3.8.4c8.3,0,11.5-6.1,11.5-11.4,0-5.5-.2-19.9-.3-39.1a102.4,102.4,0,0,1-22.6,2.7c-43.1,0-52.9-33.5-52.9-33.5-10.2-26.5-24.9-33.6-24.9-33.6-19.5-13.7-.1-14.1,1.4-14.1h.1c22.5,2,34.3,23.8,34.3,23.8,11.2,19.6,26.2,25.1,39.6,25.1a63,63,0,0,0,25.6-6c2-14.8,7.8-24.9,14.2-30.7-49.7-5.8-102-25.5-102-113.5,0-25.1,8.7-45.6,23-61.6-2.3-5.8-10-29.2,2.2-60.8a18.64,18.64,0,0,1,5-.5c8.1,0,26.4,3.1,56.6,24.1a208.21,208.21,0,0,1,112.2,0c30.2-21,48.5-24.1,56.6-24.1a18.64,18.64,0,0,1,5,.5c12.2,31.6,4.5,55,2.2,60.8,14.3,16.1,23,36.6,23,61.6,0,88.2-52.4,107.6-102.3,113.3,8,7.1,15.2,21.1,15.2,42.5,0,30.7-.3,55.5-.3,63,0,5.4,3.1,11.5,11.4,11.5a19.35,19.35,0,0,0,4-.4C415.9,449.2,480,363.1,480,261.7,480,134.9,379.7,32,256,32Z" />
                </svg>
              </motion.div>
            </motion.a>
            <motion.a
              href="https://twitter.com/gjworks2"
              target="_blank"
              className="group flex flex-1 cursor-pointer justify-center"
            >
              <motion.div variants={parentVariants} className="px-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="dark:fill-dark-400 dark:group-hover:fill-dark-100 h-6 w-6 fill-gray-900 stroke-1 group-hover:fill-gray-700"
                  width="512"
                  height="512"
                  viewBox="0 0 512 512"
                >
                  <title>ionicons-v5_logos</title>
                  <path d="M496,109.5a201.8,201.8,0,0,1-56.55,15.3,97.51,97.51,0,0,0,43.33-53.6,197.74,197.74,0,0,1-62.56,23.5A99.14,99.14,0,0,0,348.31,64c-54.42,0-98.46,43.4-98.46,96.9a93.21,93.21,0,0,0,2.54,22.1,280.7,280.7,0,0,1-203-101.3A95.69,95.69,0,0,0,36,130.4C36,164,53.53,193.7,80,211.1A97.5,97.5,0,0,1,35.22,199v1.2c0,47,34,86.1,79,95a100.76,100.76,0,0,1-25.94,3.4,94.38,94.38,0,0,1-18.51-1.8c12.51,38.5,48.92,66.5,92.05,67.3A199.59,199.59,0,0,1,39.5,405.6,203,203,0,0,1,16,404.2,278.68,278.68,0,0,0,166.74,448c181.36,0,280.44-147.7,280.44-275.8,0-4.2-.11-8.4-.31-12.5A198.48,198.48,0,0,0,496,109.5Z" />
                </svg>
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
