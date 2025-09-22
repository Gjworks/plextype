"use client";

import { JSX } from "react";
import Link from "next/link";

interface Props {
  page: number;
  totalPages: number;
  onPageChange?: (page: number) => void; // 선택적
  basePath?: string; // 게시판용 URL
}

const PageNavigation = ({ page, totalPages, onPageChange, basePath = "" }: Props) => {
  const pageNavationList = (): JSX.Element[] | null => {
    const result: JSX.Element[] = [];
    if (!totalPages) return null;

    for (let i = 1; i <= totalPages; i++) {
      if (onPageChange) {
        // 댓글용: 버튼 클릭 시 state 변경
        result.push(
          <button
            key={i}
            onClick={() => onPageChange(i)}
            className={
              "flex items-center justify-center rounded-md text-sm w-[2.25rem] h-[2.25rem] " +
              (page === i
                ? "bg-white dark:bg-dark-900 text-gray-950 dark:text-white border border-gray-300 dark:border-dark-700 hover:border-gray-950"
                : "text-gray-500 hover:text-black")
            }
          >
            {i}
          </button>
        );
      } else {
        // 게시판용: Link로 페이지 이동
        result.push(
          <Link
            key={i}
            href={`${basePath}?page=${i}`}
            className={
              "flex items-center justify-center rounded-md text-sm w-[2.25rem] h-[2.25rem] " +
              (page === i
                ? "bg-white dark:bg-dark-900 text-gray-950 dark:text-white border border-gray-300 dark:border-dark-700 hover:border-gray-950"
                : "text-gray-500 hover:text-black")
            }
          >
            {i}
          </Link>
        );
      }
    }
    return result;
  };

  const handlePrev = () => {
    if (onPageChange) return onPageChange(Math.max(page - 1, 1));
  };
  const handleNext = () => {
    if (onPageChange) return onPageChange(Math.min(page + 1, totalPages));
  };

  return (
    <div className="flex items-center">
      <nav className="flex gap-1" aria-label="Pagination">
        {onPageChange ? (
          <button
            onClick={handlePrev}
            className="flex items-center justify-center rounded-md text-sm w-[2.25rem] h-[2.25rem] text-gray-500 hover:text-gray-950 hover:bg-gray-200 dark:hover:text-white dark:hover:bg-dark-900"
          >
            <span className="sr-only">Previous</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
            </svg>
          </button>
        ) : (
          <Link
            href="#"
            className="flex items-center justify-center rounded-md text-sm w-[2.25rem] h-[2.25rem] text-gray-500 hover:text-gray-950 hover:bg-gray-200 dark:hover:text-white dark:hover:bg-dark-900"
          >
            <span className="sr-only">Previous</span>
          </Link>
        )}

        {pageNavationList()}

        {onPageChange ? (
          <button
            onClick={handleNext}
            className="flex items-center justify-center rounded-md text-sm w-[2.25rem] h-[2.25rem] text-gray-500 hover:text-gray-950 hover:bg-gray-200 dark:hover:text-white dark:hover:bg-dark-900"
          >
            <span className="sr-only">Next</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </button>
        ) : (
          <Link
            href="#"
            className="flex items-center justify-center rounded-md text-sm w-[2.25rem] h-[2.25rem] text-gray-500 hover:text-gray-950 hover:bg-gray-200 dark:hover:text-white dark:hover:bg-dark-900"
          >
            <span className="sr-only">Next</span>
          </Link>
        )}
      </nav>
    </div>
  );
};

export default PageNavigation;