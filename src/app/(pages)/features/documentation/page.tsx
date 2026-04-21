"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import React from "react";

const Page = () => {
  const parentVariants = {
    onscreen: {
      transition: { staggerChildren: 0.2 },
    },
    offscreen: {
      transition: { staggerChildren: 0.2, staggerDirection: -1 },
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
      <motion.div
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: false, amount: 0.1 }}
        variants={parentVariants}
        className="py-[200px]"
      >
        <div className="relative mx-auto px-3">
          <div className="grid grid-cols-12 gap-0 lg:gap-8 py-10">
            <div className="col-span-12">
              <div className="">
                <div className="w-full lg:w-3/5">
                  <motion.div
                    variants={variants}
                    className="text-primary-600 text-sm dark:text-white"
                  >
                    BEST UI TEMPLATES
                  </motion.div>
                  <motion.div
                    variants={variants}
                    className="mb-4 text-xl font-semibold text-black lg:text-4xl dark:text-white !leading-tight tracking-tight"
                  >
                    BEST UI TEMPLATES
                  </motion.div>
                  <motion.div
                    variants={variants}
                    className="dark:text-dark-500 text-sm lg:text-base text-gray-500 "
                  >
                    컴포넌트는 React와 Next.js에서 사용할 수 있습니다. 모든
                    Component는 tailwindcss와 Framer motion을 활용하여
                    애니메이션과 스타일을 정의했습니다.
                  </motion.div>
                  <motion.div
                    variants={variants}
                    className="hidden justify-center pt-8"
                  >
                    <Link
                      href="#"
                      className="inline-block bg-primary-500 hover:bg-primary-600 text-white py-2 px-8 rounded-full text-sm font-semibold"
                    >
                      자세히보기
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Page;
