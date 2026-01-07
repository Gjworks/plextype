"use client";

import { motion } from "framer-motion";
import MainLayout from "src/layouts/fullLayout/Layout";
import { Square3Stack3DIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

export default function Page() {
  const parentVariants = {
    onscreen: {
      transition: { staggerChildren: 0.05 },
    },
    offscreen: {
      transition: { staggerChildren: 0.05, staggerDirection: -1 },
    },
  };
  const variants = {
    onscreen: {
      y: 0,
      opacity: [0, 1],
      transition: {
        duration: 0.5,
      },
    },
    offscreen: {
      y: 25,
      opacity: 0,
    },
  };
  const variants2 = {
    onscreen: {
      opacity: [0, 1],
      transition: {
        duration: 0.5,
      },
    },
    offscreen: {
      opacity: 0,
    },
  };

  return (
    <MainLayout>
      <div className="relative overflow-hidden">
        <div className="relative px-3">
          <div className="relative py-20 bg-[url(/assets/images/bg46.jpg)] bg-no-repeat bg-cover bg-center rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950/90 via-gray-950/40 to-gray-950/90 dark:from-dark-950 dark:via-dark-950/40 dark:to-dark-950 rounded-2xl"></div>
            <div className="max-w-screen-xl mx-auto px-3 rounded-2xl">
              <div className="relative flex justify-center items-center rounded-2xl overflow-hidden h-[560px] md:h-[calc(100vh-232px)]">
                <motion.div
                  variants={parentVariants}
                  initial="offscreen"
                  whileInView="onscreen"
                  viewport={{ once: false, amount: 0.3 }}
                  className="w-full"
                >
                  <div className="relative mb-12">
                    <motion.div variants={variants} className="px-1 lg:mb-2">
                      <div className="flex gap-0 sm:gap-2 flex-wrap justify-center text-4xl font-normal md:font-semibold  lg:text-6xl  w-full">
                        <div className="!leading-tight tracking-tight text-white">
                          Flexible Type
                        </div>
                        <div className="!leading-tight tracking-tight text-white">
                          {" "}
                          System
                        </div>
                      </div>
                    </motion.div>
                    <motion.div
                      variants={variants}
                      className="flex gap-0 sm:gap-2 flex-wrap justify-center pl-0 text-4xl font-normal md:font-semibold  lg:text-6xl  mb-12"
                    >
                      <div className="!leading-tight tracking-tight text-white">
                        Creative Platform
                      </div>
                      <div className="!leading-tight tracking-tight text-white">
                        Service
                      </div>
                    </motion.div>
                    <motion.div
                      variants={variants}
                      className="w-full px-1 lg:mb-2 text-sm md:text-base pb-4 lg:pb-0 text-white/75 dark:text-dark-100 text-center"
                    >
                      지제이웍스는 웹과 앱을 개발하기 위한 소규모 개발팀입니다.
                    </motion.div>
                    <motion.div
                      variants={variants}
                      className="w-full px-1 lg:mb-2 text-sm md:text-base pb-4 lg:pb-0 text-white/75 dark:text-dark-100 text-center"
                    >
                      우리는 혁신적이고 미래 지향적 인 기업, 신생 기업 및
                      비즈니스와 협력하여 매력적인 제품을 연구하고 개발합니다.
                    </motion.div>
                  </div>

                  <div className="flex items-center w-full md:w-2/5 mx-auto h-[80px]">
                    <motion.div
                      variants={variants}
                      className="relative mx-auto flex items-center gap-4"
                    >
                      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[380px] h-[80px] bg-[url(/assets/svg/dotted.svg)] bg-cover bg-center bg-no-repeat"></div>
                      <div className="dark:bg-dark-800 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm p-3">
                        <Square3Stack3DIcon className="size-5 text-white dark:text-white stroke-1" />
                      </div>
                      <div className="flex-1">
                        <div className="dark:text-white mb-2 text-left text-sm text-white">
                          Platform Extensible
                        </div>
                        <div className="dark:text-dark-400 text-left text-xs text-white/75">
                          다양한 프로젝트를 만나보시고 좋은 의견과 아이디어를
                          주시면 반영하겠습니다.
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        <div className="-mt-32 pt-6">
          <div className="max-w-screen-xl mx-auto px-3">
            <div className="flex justify-center gap-6 md:gap-12 px-3">
              <div className="relative w-44 md:w-64 flex-none -rotate-[24deg] translate-y-52">
                <div className="relative rounded-2xl p-5 bg-gray-50 dark:bg-dark-800 transition-all duration-700 hover:-translate-y-6 h-80 hover:shadow-lg hover:shadow-gray-950/10">
                  <div className="grid place-content-between h-full gap-4">
                    <div className="text-xl font-light text-gray-400 dark:text-dark-400">
                      Approach expanding{" "}
                      <span className="font-semibold text-gray-950 dark:text-white">
                        workplace
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-dark-400">Sessions</div>
                  </div>
                </div>
              </div>
              <div className="relative w-44 md:w-64 flex-none -rotate-[16deg] translate-y-24">
                <div className="relative rounded-2xl p-5 bg-gray-50 bg-[url(/assets/images/bg46.jpg)] bg-no-repeat bg-cover bg-center transition-all duration-700 hover:-translate-y-6 h-60 md:h-80 hover:shadow-lg hover:shadow-gray-950/50">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-gray-950/30 via-gray-950/40 to-gray-950/70"></div>
                </div>
              </div>
              <div className="relative w-44 md:w-64 flex-none -rotate-[10deg] translate-y-6">
                <div className="relative rounded-2xl p-5 bg-gray-50 dark:bg-dark-800 transition-all duration-700 hover:-translate-y-6 h-60 md:h-80 hover:shadow-lg hover:shadow-gray-950/10">
                  <div className="grid place-content-between h-full gap-4">
                    <div className="text-xl font-light text-gray-400 dark:text-dark-400">
                      Approach expanding{" "}
                      <span className="font-semibold text-gray-950 dark:text-white">
                        workplace
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-dark-400">Sessions</div>
                  </div>
                </div>
              </div>
              <div className="relative w-44 md:w-64 flex-none">
                <div className="relative rounded-2xl p-5 bg-gray-50 bg-[url(/assets/images/bg39.jpg)] bg-no-repeat bg-cover bg-center transition-all duration-700 hover:-translate-y-6 h-60 md:h-80 hover:shadow-lg hover:shadow-gray-950/50">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-gray-950/50 via-gray-950/40 to-gray-950/70"></div>
                  <div className="relative grid place-content-between h-full gap-4">
                    <div className="text-xl font-light text-white/70">
                      find{" "}
                      <span className="font-semibold text-white">your</span>{" "}
                      possibilities
                    </div>
                    <div className="text-xs text-white/50">Loquence</div>
                  </div>
                </div>
              </div>
              <div className="relative w-44 md:w-64 flex-none rotate-[10deg] translate-y-6">
                <div className="relative rounded-2xl p-5 bg-gray-50 dark:bg-dark-800 transition-all duration-700 hover:-translate-y-6 h-60 md:h-80 hover:shadow-lg hover:shadow-gray-950/10">
                  <div className="grid place-content-between h-full gap-4">
                    <div className="text-xl font-light text-gray-400 dark:text-dark-400">
                      find{" "}
                      <span className="font-semibold text-gray-950 dark:text-white">your</span>{" "}
                      possibilities
                    </div>
                    <div className="text-xs text-gray-600 dark:text-dark-400">Loquence</div>
                  </div>
                </div>
              </div>
              <div className="relative w-44 md:w-64 flex-none rotate-[16deg] translate-y-24">
                <div className="relative rounded-2xl p-5 bg-gray-50 bg-[url(/assets/images/bg41.jpg)] bg-no-repeat bg-cover bg-center transition-all duration-700 hover:-translate-y-6 h-60 md:h-80 hover:shadow-lg hover:shadow-gray-950/50">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-gray-950/30 via-gray-950/40 to-gray-950/70"></div>
                </div>
              </div>
              <div className="relative w-44 md:w-64 flex-none rotate-[24deg] translate-y-52">
                <div className="relative rounded-2xl p-5 bg-gray-50 dark:bg-dark-800 transition-all duration-700 hover:-translate-y-6 h-60 md:h-80 hover:shadow-lg hover:shadow-gray-950/10">
                  <div className="grid place-content-between h-full gap-4">
                    <div className="text-xl font-light text-gray-400 dark:text-dark-400">
                      Approach expanding{" "}
                      <span className="font-semibold text-gray-950 dark:text-white">
                        workplace
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-dark-400">Sessions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-screen-xl mx-auto">
          <motion.div className="">
            <div className="grid grid-cols-12">
              <div className="col-span-12">
                <div className="w-full md:w-2/5 mx-auto relative px-3 pt-6 md:pt-20 pb-8">
                  <motion.div
                    initial="offscreen"
                    whileInView="onscreen"
                    viewport={{ once: false, amount: 0.1 }}
                    variants={parentVariants}
                    className="flex items-center h-full"
                  >
                    <div className="">
                      <div className="flex">
                        <div className="w-full">
                          <motion.div
                            variants={variants}
                            className="mb-4 text-2xl font-thin text-black md:text-4xl dark:text-white !leading-tight tracking-tight text-center"
                          >
                            6 best things for
                            <br />{" "}
                            <span className={`text-primary-500`}>
                              employees
                            </span>{" "}
                            & what they deserve!
                          </motion.div>
                          <motion.div
                            variants={variants}
                            className="dark:text-dark-500 text-xs md:text-sm text-gray-400 text-center"
                          >
                            컴포넌트는 React와 Next.js에서 사용할 수 있습니다.
                            모든 Component는 tailwindcss와 Framer motion을
                            활용하여 애니메이션과 스타일을 정의했습니다.
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
              <div className="col-span-7"></div>
            </div>
          </motion.div>
        </div>

        <div className="pt-12 pb-20 overflow-hidden">
          <motion.div
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: false, amount: 0.1 }}
            variants={parentVariants}
            className="max-w-screen-xl mx-auto px-3"
          >
            <div className={`grid grid-cols-12 gap-8`}>
              <div className="col-span-12  ㅊ md:col-span-6">
                <div className="text-sm font-semibold text-gray-700 dark:text-dark-100 border-b border-gray-200/75 dark:border-dark-800 pb-2 pt-2">
                  Notice
                </div>
              </div>
              <div className="col-span-12  ㅊ md:col-span-6">
                <div className="text-sm font-semibold text-gray-700 dark:text-dark-100 border-b border-gray-200/75 dark:border-dark-800 pb-2 pt-2">
                  Supports
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
