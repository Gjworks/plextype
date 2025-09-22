"use client";

import React, {useEffect, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import PostsHeader from "./header";
import {getPostsAction} from "src/extentions/posts/scripts/actions/getPostsAction";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {usePostContext} from "./PostProvider";
import "dayjs/locale/ko";
dayjs.extend(relativeTime); // ← 반드시 플러그인 확장
dayjs.locale("ko");
import {
  HomeIcon,
  ChevronRightIcon,
  ChatBubbleOvalLeftEllipsisIcon,
} from "@heroicons/react/24/outline";
import PageNavigation from "@plextype/components/nav/PageNavigation";
import PostNotPermission from "@/extentions/posts/templates/default/notPermission";

interface Pagination {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
}

const PostsListClient = ({
                           posts,
                           pagination: initialPagination
                         }: {
  posts: any[];
  pagination: Pagination;
}) => {
  const router = useRouter();
  const [documentInfo, setDocumentInfo] = useState(posts);
  const [pagination, setPagination] = useState(initialPagination);
  const [page, setPage] = useState(pagination.currentPage);
  const {postInfo} = usePostContext();

  const { permissions } = usePostContext();

  if (!permissions.doList) {
    return <PostNotPermission/>;
  }

  const handlePageChange = async (newPage: number) => {
    setPage(newPage);

    // SPA처럼 서버 액션 호출
    const {items, pagination: newPagination} = await getPostsAction(postInfo.pid, newPage, pagination.pageSize);
    setDocumentInfo(items);
    setPagination(newPagination);
    router.replace(`/posts/${postInfo.pid}?page=${newPage}`, {scroll: false});
  };

  return (
    <>
      <PostsHeader/>
      <div className=" mb-6">
        {documentInfo.map((doc) => (
          <div
            key={doc.id}
            className="flex flex-wrap gap-4 lg:gap-2"
          >
            <Link href={`/posts/${postInfo.pid}/view/${doc.id}`} className="flex-1 hover:bg-gray-50 px-3 py-4 lg:py-8">
              <div

                className="text-sm lg:text-base font-semibold text-gray-950 dark:text-white line-clamp-2 mb-2"
              >
                {doc.title}
              </div>
              <div className={`mb-4 text-sm wrap-break-word break-keep text-gray-500 dark:text-gray-300 line-clamp-1`}>
                {doc.content}
              </div>

              <div className="flex items-center">
                <div
                  className="relative text-primary-500 pr-3 text-xs before:absolute before:h-[12px] before:w-[1px] before:right-0 before:top-1/2 before:-translate-y-1/2 before:bg-gray-300">
                  {doc.category ? doc.category.title : ""}
                </div>
                <div
                  className="relative text-gray-900 dark:text-dark-100 text-xs px-3 before:absolute before:h-[12px] before:w-[1px] before:right-0 before:top-[4px] before:bg-gray-300">
                  {doc.user?.nickName}
                </div>
                <div
                  className="relative text-gray-400 text-xs px-3 before:absolute before:h-[12px] before:w-[1px] before:right-0 before:top-[4px] before:bg-gray-300">
                  {dayjs(doc.createdAt).fromNow()}
                </div>
                <div
                  className="relative flex gap-2 px-3 before:absolute before:h-[12px] before:w-[1px] before:right-0 before:top-[4px] before:bg-gray-300">
                  <div className="text-xs text-gray-400">댓글</div>
                  <div className="text-xs text-gray-700">
                    {doc.commentCount}
                  </div>
                </div>
                <div className="flex gap-2 px-3">
                  <div className="text-xs text-gray-400">조회수</div>
                  <div className="text-xs text-gray-700">
                    {doc.readCount}
                  </div>
                </div>
              </div>
            </Link>
            <div className="hidden items-center w-full lg:w-1/5">
              <div
                className="flex-1 bg-gray-100 dark:bg-dark-900 dark:lg:bg-transparent lg:bg-white py-2 rounded-md border lg:border-0 border-gray-200 dark:border-dark-800">
                <div
                  className="flex items-center gap-4 lg:block pl-3 lg:pl-8 border-l border-gray-200 dark:border-dark-800">
                  <div className="flex items-center gap-2 mb-0 lg:mb-1">
                    <ChatBubbleOvalLeftEllipsisIcon className="size-5 stroke-1 text-gray-400"/>
                    <div className="text-xs lg:text-sm text-gray-900 dark:text-dark-100">
                      관리자
                    </div>
                    <div className="text-gray-500 text-xs">26분전</div>
                  </div>
                  <div className="text-xs text-gray-500  line-clamp-1">
                    테스트용으로 작성된 댓글입니다. 테스트용으로 작성된
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className={`flex items-center justify-end gap-4`}>
        <div className={``}>
          <Link href={`/posts/${postInfo.pid}/create`}
                className={`text-sm bg-orange-100 text-orange-600 hover:bg-orange-200 py-1.5 px-4 rounded-md`}>글쓰기</Link>
        </div>
      </div>
      <div className="pt-10 pb-20">
        <div className="">
          <div className="flex justify-between gap-4 flex-wrap">
            <div className="w-full flex justify-center">
              <PageNavigation
                page={page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
            <div className="flex justify-end flex-1"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PostsListClient;
