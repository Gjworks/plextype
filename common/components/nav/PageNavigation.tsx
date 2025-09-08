"use client";

import { JSX } from "react";
import Link from "next/link";
interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PageNavigation = ({ page, totalPages, onPageChange }: Props) => {
  // const { pathname, totalCount, totalPages, page, listCount } = props;

  const pageNavationList = (): JSX.Element[] | null => {
    const result: JSX.Element[] = [];
    if (!totalPages) {
      return null; // 페이지 네비게이션 정보가 초기화되지 않은 경우 아무것도 렌더링하지 않습니다.
    }
    for (let i = 1; i <= totalPages; i++) {
      result.push(
        <button
          key={i}
          // href={{ pathname: pathname, query: { page: i } }}
          // href={`${pathname}?page=${i}`}
          // prefetch={false}
          onClick={() => onPageChange(i)}
          className={
            "flex items-center justify-center rounded-md  text-sm w-[2.25rem] h-[2.25rem]  text-gray-500 hover:text-black " +
            (page == i
              ? "bg-white dark:bg-dark-900 text-gray-950 dark:text-white border border-gray-300 dark:border-dark-700 hover:border-gray-950 "
              : "text-gray-500")
          }
        >
          {i}
        </button>,
      );
    }
    return result;
  };

  return (
    <div className="flex items-center">
      <div className="flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <nav className="flex gap-1" aria-label="Pagination">
            <Link
              href="#"
              className="flex items-center justify-center rounded-md text-sm w-[2.25rem] h-[2.25rem] text-gray-500 hover:text-gray-950 hover:bg-gray-200 dark:hover:text-white dark:hover:bg-dark-900"
            >
              <span className="sr-only">Previous</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
            {pageNavationList()}
            <Link
              href="#"
              className="flex items-center justify-center rounded-md  text-sm w-[2.25rem] h-[2.25rem] text-gray-500 hover:text-gray-950 hover:bg-gray-200 dark:hover:text-white dark:hover:bg-dark-900"
            >
              <span className="sr-only">Next</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default PageNavigation;
