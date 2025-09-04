"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import nav from "@plextype/res/config/navigation.json";
import { usePathname } from "next/navigation";
import DefaultNav from "@plextype/components/nav/DefaultNav";

interface Inspage {
  name: string;
  title: string;
  parent: string;
  route: string;
  subMenu: [];
}
const SubNav = () => {
  const [currentPage, setCurrentPage] = useState<Inspage | undefined>();
  const [subMenu, setSubMenu] = useState<any[] | undefined>();
  // const [lastParam, setLastParam] = useState<any | undefined>()

  // const [firstNavTitle, setFirstNavTitle] = useState<string>()
  const pathname = usePathname();

  useEffect(() => {
    const params = pathname?.split("/");

    let _subMenu;
    if (params?.length) {
      if (params?.length > 2) {
        setCurrentPage(nav.header[params?.[2]]);
      } else {
        setCurrentPage(nav.header[params?.[1]]);
      }
      // setCurrentPage(nav.header[params?.[1]])
    }

    if (currentPage) {
      _subMenu = currentPage.subMenu;
      if (_subMenu) {
        if (_subMenu.length > 0) {
          setSubMenu(_subMenu);
        } else {
          _subMenu = Array("");
          setSubMenu(_subMenu);
        }
      }
    } else {
      _subMenu = null;
      setSubMenu(_subMenu);
    }
  }, [pathname, currentPage]);

  const snav = null;
  return (
    <>
      {subMenu && (
        <div className="bg-white/90 dark:bg-dark-900 backdrop-blur-lg z-50 block-line-b">
          <div className="w-full px-0 sm:px-8">
            <div className="flex justify-center gap-4 px-3 w-full">
              <div className="relative overflow-scroll-hide flex gap-4 w-full items-center overflow-hidden overflow-x-auto justify-center">
                {subMenu.length > 0 && (
                  <div className="relative pr-4">
                    <div className="flex gap-8 ">
                      {Object.entries(subMenu).map(([key, value], index) => {
                        if (value.route) {
                          return (
                            <div key={value.name}>
                              <Link
                                href={value.route}
                                className={
                                  "block whitespace-nowrap px-2 py-3 text-[0.782rem] text-black hover:text-gray-500 " +
                                  (pathname === value.route
                                    ? " text-gray-900  dark:text-white border-b-2 border-gray-950 "
                                    : " text-gray-400 hover:text-gray-100 dark:text-dark-600 dark:hover:text-dark-300")
                                }
                              >
                                {value.title}
                              </Link>
                            </div>
                          );
                        } else {
                          return null;
                        }
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* <div className="max-w-32 hidden lg:flex items-center">
                  <Link
                    href="#"
                    className="text-gray-950 hover:text-gray-600 text-sm dark:bg-primary-"
                  >
                    Download
                  </Link>
                </div> */}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubNav;
