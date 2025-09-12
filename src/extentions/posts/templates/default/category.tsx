"use client";

import {useEffect, useRef, useState} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {usePostContext} from "@/extentions/posts/templates/default/PostProvider";
import DefaultNav from "@plextype/components/nav/DefaultNav";


const PostsCategories = () => {
  const pathname = usePathname();
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [tabUnderlineWidth, setTabUnderlineWidth] = useState(0);
  const [tabUnderlineLeft, setTabUnderlineLeft] = useState(0);
  const tabsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  // const [Category, setCategory] = useState<{ id: number; name: string }[]>([]);
  const { postInfo } = usePostContext();
  const Category = postInfo.categories;

  useEffect(() => {
    function setTabPosition() {
      const currentTab = tabsRef.current[activeTabIndex];
      if (currentTab) {
        setTabUnderlineLeft(currentTab.offsetLeft);
        setTabUnderlineWidth(currentTab.clientWidth);
      }
    }

    setTabPosition();
    window.addEventListener("resize", setTabPosition);

    return () => window.removeEventListener("resize", setTabPosition);
  }, [activeTabIndex]);

  return (
    <>

      <div
        className="flex sticky top-0 lg:top-0 w-full bg-white/90 dark:bg-dark-950/40 backdrop-blur-lg z-90 border-b border-gray-100 dark:border-dark-700">
        <div
          className="relative overflow-scroll-hide overflow-hidden overflow-x-auto flex justify-start md:justify-center gap-8 px-3">
          <Link
            key={0}
            href=""
            ref={(el) => {
              tabsRef.current[0] = el;
            }}
            onClick={() => setActiveTabIndex(0)}
            className={
              "block whitespace-nowrap py-4 px-1 text-sm hover:text-gray-950 dark:hover:text-dark-300 " +
              (pathname === ''
                ? "text-gray-950 hover:text-gray-400 dark:text-white dark:hover:text-white"
                : "text-gray-600 dark:text-dark-300 dark:hover:text-white")
            }
          >
            전체
          </Link>
          {Category &&
            Category.map((item, index) => {
              const tabIndex = index + 1; // 카테고리는 1번부터 시작
              return (
                <Link
                  key={tabIndex}
                  href=""
                  ref={(el) => {
                    tabsRef.current[tabIndex] = el;
                  }}
                  onClick={() => setActiveTabIndex(tabIndex)}
                  className={
                    "block whitespace-nowrap py-4 px-1 text-sm hover:text-gray-950 dark:hover:text-dark-300 " +
                    (pathname === item.route
                      ? "text-gray-950 hover:text-gray-400 dark:text-white dark:hover:text-white"
                      : "text-gray-600 dark:text-dark-300 dark:hover:text-white")
                  }
                >
                  {item.title}
                </Link>
              );
            })}
          <div
            className="absolute bottom-0 block h-1 bg-gray-950 dark:bg-white transition-all duration-300"
            style={{left: tabUnderlineLeft, width: tabUnderlineWidth}}
          ></div>
        </div>
      </div>
    </>
  );
};

export default PostsCategories;
