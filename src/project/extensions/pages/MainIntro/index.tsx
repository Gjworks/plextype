"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import ContentListWidget from "@widgets/content/ContentListWidget";

export default function MainIntro() {
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

  return (
    <div className="relative overflow-hidden">
      <div className="relative px-3">
        <div className="relative py-20 bg-[url('/assets/images/bg46.jpg')] bg-no-repeat bg-cover bg-center rounded-2xl">
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
                    <div className="text-white dark:bg-dark-800 rounded-lg bg-gray-950/5 border border-white/10 backdrop-blur-sm p-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3"
                        />
                      </svg>
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
                    Build modular{" "}
                    <span className="font-semibold text-gray-950 dark:text-white">
                      platforms
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-dark-400">
                    Plextype Core
                  </div>
                </div>
              </div>
            </div>
            <div className="relative w-44 md:w-64 flex-none -rotate-[16deg] translate-y-24">
              <div className="relative h-60 overflow-hidden rounded-2xl bg-dark-950 p-5 ring-1 ring-white/10 transition-all duration-700 hover:-translate-y-6 hover:shadow-lg hover:shadow-gray-950/50 md:h-80">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_28%),linear-gradient(145deg,rgba(20,184,166,0.22),transparent_42%),linear-gradient(315deg,rgba(99,102,241,0.18),transparent_38%)]" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="space-y-2">
                    <div className="h-2 w-16 rounded-full bg-white/40" />
                    <div className="h-2 w-24 rounded-full bg-white/20" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2, 3, 4, 5].map((item) => (
                      <div key={item} className="h-10 rounded-lg border border-white/10 bg-white/[0.06] backdrop-blur" />
                    ))}
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/40">Admin</div>
                      <div className="mt-1 text-lg font-semibold leading-tight text-white">Control Layer</div>
                    </div>
                    <div className="h-10 w-10 rounded-full border border-white/15 bg-white/10" />
                  </div>
                </div>
              </div>
            </div>
            <div className="relative w-44 md:w-64 flex-none -rotate-[10deg] translate-y-6">
              <div className="relative rounded-2xl p-5 bg-gray-50 dark:bg-dark-800 transition-all duration-700 hover:-translate-y-6 h-60 md:h-80 hover:shadow-lg hover:shadow-gray-950/10">
                <div className="grid place-content-between h-full gap-4">
                  <div className="text-xl font-light text-gray-400 dark:text-dark-400">
                    Design flexible{" "}
                    <span className="font-semibold text-gray-950 dark:text-white">
                      systems
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-dark-400">
                    Extension Ready
                  </div>
                </div>
              </div>
            </div>
            <div className="relative w-44 md:w-64 flex-none">
              <div className="relative h-60 overflow-hidden rounded-2xl bg-dark-950 p-5 ring-1 ring-white/10 transition-all duration-700 hover:-translate-y-6 hover:shadow-lg hover:shadow-gray-950/50 md:h-80">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),transparent_30%),radial-gradient(circle_at_70%_30%,rgba(14,165,233,0.24),transparent_32%),radial-gradient(circle_at_35%_75%,rgba(244,63,94,0.16),transparent_30%)]" />
                <div className="absolute inset-x-5 top-8 h-px bg-white/15" />
                <div className="absolute bottom-6 left-6 top-12 w-px bg-white/15" />
                <div className="relative grid place-content-between h-full gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-white/70" />
                      <div className="h-2 w-28 rounded-full bg-white/25" />
                    </div>
                    <div className="ml-4 rounded-xl border border-white/10 bg-white/[0.06] p-3">
                      <div className="h-2 w-20 rounded-full bg-white/40" />
                      <div className="mt-2 h-2 w-28 rounded-full bg-white/15" />
                    </div>
                    <div className="ml-12 rounded-xl border border-white/10 bg-white/[0.06] p-3">
                      <div className="h-2 w-16 rounded-full bg-white/40" />
                      <div className="mt-2 h-2 w-24 rounded-full bg-white/15" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-light text-white/70">
                      smarter <span className="font-semibold text-white">flows</span>
                    </div>
                    <div className="mt-1 text-xs text-white/50">Practical Automation</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative w-44 md:w-64 flex-none rotate-[10deg] translate-y-6">
              <div className="relative rounded-2xl p-5 bg-gray-50 dark:bg-dark-800 transition-all duration-700 hover:-translate-y-6 h-60 md:h-80 hover:shadow-lg hover:shadow-gray-950/10">
                <div className="grid place-content-between h-full gap-4">
                  <div className="text-xl font-light text-gray-400 dark:text-dark-400">
                    ship{" "}
                    <span className="font-semibold text-gray-950 dark:text-white">
                      better
                    </span>{" "}
                    ideas
                  </div>
                  <div className="text-xs text-gray-600 dark:text-dark-400">
                    Gjworks Lab
                  </div>
                </div>
              </div>
            </div>
            <div className="relative w-44 md:w-64 flex-none rotate-[16deg] translate-y-24">
              <div className="relative h-60 overflow-hidden rounded-2xl bg-dark-950 p-5 ring-1 ring-white/10 transition-all duration-700 hover:-translate-y-6 hover:shadow-lg hover:shadow-gray-950/50 md:h-80">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.16),transparent_24%),linear-gradient(160deg,rgba(34,197,94,0.16),transparent_36%),linear-gradient(330deg,rgba(251,146,60,0.16),transparent_36%)]" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3 font-mono text-[10px] leading-5 text-white/55">
                    <div><span className="text-white/30">$</span> npm run setup</div>
                    <div><span className="text-white/30">$</span> prisma sync</div>
                    <div><span className="text-white/30">$</span> deploy cleanly</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-16 rounded-xl border border-white/10 bg-white/[0.06]" />
                    <div className="h-16 rounded-xl border border-white/10 bg-white/[0.06]" />
                  </div>
                  <div>
                    <div className="text-xl font-light text-white/70">
                      reliable <span className="font-semibold text-white">launches</span>
                    </div>
                    <div className="mt-1 text-xs text-white/50">Project Runtime</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative w-44 md:w-64 flex-none rotate-[24deg] translate-y-52">
              <div className="relative rounded-2xl p-5 bg-gray-50 dark:bg-dark-800 transition-all duration-700 hover:-translate-y-6 h-60 md:h-80 hover:shadow-lg hover:shadow-gray-950/10">
                <div className="grid place-content-between h-full gap-4">
                  <div className="text-xl font-light text-gray-400 dark:text-dark-400">
                    Create lasting{" "}
                    <span className="font-semibold text-gray-950 dark:text-white">
                      services
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-dark-400">
                    Developer First
                  </div>
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
                          Build systems for
                          <br />{" "}
                          <span className={`text-primary-500`}>
                            creators
                          </span>{" "}
                          who ship with clarity.
                        </motion.div>
                        <motion.div
                          variants={variants}
                          className="dark:text-dark-500 text-xs md:text-sm text-gray-400 text-center"
                        >
                          Gjworks builds extensible web systems with Plextype,
                          AI-assisted workflows, and practical developer tools.
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
            <div className="col-span-12 md:col-span-6">
              <div className="text-sm font-semibold text-gray-700 dark:text-dark-100 border-b border-gray-200/75 dark:border-dark-800 pb-2 pt-2">
                Notice
              </div>
              <div>
                <ContentListWidget mid="notice" count={5} />
              </div>
            </div>
            <div className="col-span-12 md:col-span-6">
              <div className="text-sm font-semibold text-gray-700 dark:text-dark-100 border-b border-gray-200/75 dark:border-dark-800 pb-2 pt-2">
                Update
              </div>
              <div>
                <ContentListWidget mid="changelog" count={5} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
