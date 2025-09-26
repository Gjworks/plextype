"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useUser } from "@plextype/hooks/auth/useAuth";

interface Item {
  title: string;
  name: string;
  route: string;
  condition?: {
    operation: string;
    name: string;
    variable: string | boolean;
  };
}

interface DefaultListProps {
  list: Array<Item>;
  loggedInfo?: any;
  callback?: (name: string | undefined) => void;
}

const DefaultList = ({ list, loggedInfo, callback }: DefaultListProps) => {
  const pathname = usePathname();

  const handlerCallback = (name?: string) => {
    if (name && callback) callback(name);
  };

  // 부모 컨테이너 애니메이션
  const containerVariants = {
    open: {
      transition: {
        delayChildren: 0.2, // ← 여기서 0.2초 딜레이 후 자식 stagger 시작
        staggerChildren: 0.05, // 자식 요소 순차적 등장 간격
      },
    },
    close: {},
  };

  // 각 메뉴 아이템 애니메이션
  const itemVariants = {
    open: { opacity: 1, x: 0, transition: { duration: 0.2 },  display:'block' },
    close: { opacity: 0, x: -20, transition: { duration: 0.15 }, display:'none' },
  };

  return (
    <motion.div
      initial="close"
      animate="open"
      exit="close"
      variants={containerVariants}
    >
      {list?.map((item, index) => {
        if (item.name === "divider") {
          return (
            <div key={index} className="block py-2">
              <div className="h-[1px] bg-gray-200/75 dark:bg-dark-700/75" />
            </div>
          );
        }

        const showItem =
          !item.condition ||
          (item.condition &&
            loggedInfo &&
            loggedInfo[item.condition.name] === item.condition.variable);

        if (!showItem) return null;

        return (
          <motion.div
            key={index}
            variants={itemVariants}
            className="overflow-hidden"
          >
            <div className="min-w-48">
              <Link
                href={item.route}
                onClick={() => handlerCallback(item.name)}
                className={
                  "dark:hover:bg-dark-100/10 block rounded bg-transparent px-4 py-2 text-xs text-gray-800 hover:bg-gray-950 hover:text-white dark:text-white dark:hover:text-white" +
                  (pathname === item.route ? "bg-gray-950" : "bg-white")
                }
              >
                <div className="flex justify-between items-center">
                  <span>{item.title}</span>
                </div>
              </Link>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default DefaultList;