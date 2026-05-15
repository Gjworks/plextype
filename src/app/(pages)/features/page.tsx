"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, BookOpen, Boxes, GitBranch, Layers, Play, Terminal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { docsNav } from "./_components";

const iconMap: Record<string, LucideIcon> = {
  "시작하기": Terminal,
  "프로젝트 구조": Boxes,
  Extensions: GitBranch,
  "Layouts & Page": Layers,
  Posts: BookOpen,
  Previews: Play,
  "운영 규칙": BookOpen,
};

const featureLinks = [
  ...docsNav,
  { href: "/features/components", title: "Components", desc: "Modal과 Dropdown 등 기본 컴포넌트 문서" },
];

const Page = () => {
  const parentVariants = {
    onscreen: {
      transition: { staggerChildren: 0.12 },
    },
    offscreen: {
      transition: { staggerChildren: 0.08, staggerDirection: -1 },
    },
  };

  const variants = {
    onscreen: {
      y: 0,
      opacity: [0, 1],
      transition: {
        duration: 0.35,
      },
    },
    offscreen: {
      y: 18,
      opacity: 0,
    },
  };

  const cardListVariants = {
    onscreen: {
      transition: { staggerChildren: 0.08, delayChildren: 0.12 },
    },
    offscreen: {
      transition: { staggerChildren: 0.04, staggerDirection: -1 },
    },
  };

  const cardVariants = {
    onscreen: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.36,
        ease: "easeOut",
      },
    },
    offscreen: {
      y: 22,
      opacity: 0,
    },
  };

  return (
    <div className="relative flex min-h-[calc(100vh-228px)] items-center justify-center py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="flex h-full items-center justify-center">
          <div className="rotate-90 text-[7rem] font-bold uppercase tracking-normal text-black/5 sm:rotate-0 lg:text-[13rem] xl:text-[16rem] 2xl:text-[18rem] dark:text-white/5">
            Features
          </div>
        </div>
      </div>

      <motion.div
        initial="offscreen"
        animate="onscreen"
        variants={parentVariants}
        className="relative mx-auto grid h-full w-full max-w-screen-2xl grid-cols-1 gap-8 px-3 lg:grid-cols-[260px_1fr]"
      >
        <motion.div variants={variants} className="flex flex-col justify-end">
          <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Features</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-gray-700 dark:text-dark-100">프로젝트 문서</h1>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            설치, 구조, 확장, 레이아웃, 게시판 스킨 문서를 이 화면에서 바로 열어볼 수 있습니다.
          </p>
        </motion.div>

        <motion.div variants={cardListVariants} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {featureLinks.map((item) => {
            const Icon = iconMap[item.title] || BookOpen;

            return (
              <motion.div key={item.href} variants={cardVariants}>
                <Link
                  href={item.href}
                  className="group flex h-[240px] flex-col rounded-2xl bg-gray-200/80 p-5 backdrop-blur-lg transition duration-500 hover:scale-[1.02] hover:bg-primary-500 hover:shadow-lg hover:shadow-primary-900/30 dark:bg-dark-800 hover:dark:bg-primary-500"
                >
                  <div className="mb-8 flex items-center justify-between text-black transition-colors group-hover:text-white dark:text-white">
                    <Icon size={20} strokeWidth={1.4} />
                    <ArrowUpRight size={16} strokeWidth={1.6} className="opacity-40 transition-opacity group-hover:opacity-100" />
                  </div>

                  <div className="mt-auto">
                    <div className="mb-1 text-base font-semibold text-black transition-colors group-hover:text-white dark:text-white">
                      {item.title}
                    </div>
                    <div className="text-xs leading-5 text-gray-600 transition-colors group-hover:text-primary-100 dark:text-dark-400">
                      {item.desc}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Page;
