"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, Variants } from "framer-motion";

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

  const containerVariants: Variants = {
    open: {
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.05,
      },
    },
    close: {
      transition: {
        staggerChildren: 0.03,
        staggerDirection: -1,
      },
    },
  };

  const itemVariants: Variants = {
    open: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.21, 0.47, 0.32, 0.98]
      }
    },
    close: {
      opacity: 0,
      y: 10,
      transition: { duration: 0.2 }
    },
  };

  return (
    <motion.div
      initial="close"
      animate="open"
      exit="close"
      variants={containerVariants}
      className="flex flex-col py-1"
    >
      {list?.map((item, index) => {
        // 🌟 [수정] 훅(useMemo) 대신 일반 함수 로직 사용
        const getShowItem = () => {
          if (!item.condition) return true;
          if (!loggedInfo) return false;

          const { operation, name, variable } = item.condition;
          const userValue = loggedInfo[name];

          switch (operation) {
            case "equals":
              return userValue === variable;
            case "not-equals":
              return userValue !== variable;
            default:
              return userValue === variable;
          }
        };

        const showItem = getShowItem();

        if (!showItem) return null;

        // 구분선(Divider) 처리
        if (item.name === "divider") {
          return (
            <motion.div
              key={`div-${index}`}
              variants={itemVariants}
              className="py-1.5 px-3"
            >
              <div className="h-[1px] bg-black/[0.04]" />
            </motion.div>
          );
        }

        const isActive = pathname === item.route;

        return (
          <motion.div
            key={item.route + index}
            variants={itemVariants}
            className="px-1.5"
          >
            <Link
              href={item.route}
              onClick={() => handlerCallback(item.name)}
              className={`
                group flex items-center justify-between w-full px-3 py-2 rounded-lg text-[13px] font-medium transition-all mb-1
                ${isActive
                ? "bg-blue-50 text-blue-600"
                : "text-zinc-600 hover:bg-black/[0.03] hover:text-black"}
              `}
            >
              <span>{item.title}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-blue-600" />
              )}
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default DefaultList;