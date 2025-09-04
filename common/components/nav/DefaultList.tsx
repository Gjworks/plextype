"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

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
  loggedInfo?: object | undefined;
  callback?: (name: string | undefined) => void;
}

const DefaultList = ({ list, loggedInfo, callback }: DefaultListProps) => {
  const pathname = usePathname();

  const innerAnimation = {
    open: {
      opacity: 1,
      x: "0%",
      transition: {
        duration: 0.3,
      },
    },
    close: {
      opacity: 0,
      x: "-20%",
      transition: {
        duration: 0.2,
      },
    },
  };

  const handlerCallback = (name: string | undefined) => {
    if (name !== undefined && callback !== undefined) {
      callback(name);
    }
  };

  return (
    <>
      {list &&
        list.map((item, index) => {
          if (item.name === "divider") {
            return (
              <div key={index} className="block py-2">
                <div className="h-[1px] bg-gray-200/75 dark:bg-dark-700/75"></div>
              </div>
            );
          }
          return (
            <div key={index}>
              <motion.div variants={innerAnimation}>
                <div className="min-w-48">
                  <Link
                    href={item.route}
                    onClick={() => handlerCallback(item.name)}
                    className={
                      "dark:hover:bg-dark-100/10 block rounded bg-transparent px-4 py-2 text-xs text-gray-800 hover:bg-gray-950 hover:text-white dark:text-white dark:hover:text-white" +
                      (pathname === item.route ? "bg-gray-950" : "bg-white")
                    }
                  >
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <div className="">{item.title}</div>
                      </div>
                    </div>
                  </Link>
                </div>
              </motion.div>
            </div>
          );
        })}
    </>
  );
};

export default DefaultList;
