"use client";

import React, {useEffect, useState} from "react";
import Link from "next/link";
import Image from "next/image";
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

  const {permissions} = usePostContext();

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

  console.log(posts)
  return (
    <>
      <PostsHeader/>
      <div className=" mb-6">
        {documentInfo.map((doc) => (
          <div
            key={doc.id}
            className="border-b border-gray-100 hover:bg-gray-50"
          >

            <div className="flex gap-4 flex-1 px-3 py-4 lg:py-8">
              <div
                className="relative shrink-0 w-[80px] h-[80px] rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                {doc.thumbnail ? (
                  <Image
                    src={doc.thumbnail}
                    alt={doc.title || "thumbnail"}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  // ✅ 이미지가 없을 때 보여줄 회색 박스 (+ 아이콘)
                  <span className="text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                         stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round"
                            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
                    </svg>
                  </span>
                )}
              </div>
              <div className="flex items-center flex-1 flex-wrap gap-4">
                <Link href={`/posts/${postInfo.pid}/${doc.id}`} className="w-full lg:flex-1">

                  <div>
                    <div
                      className="flex items-center gap-2 text-sm lg:text-base font-semibold text-gray-950 dark:text-white line-clamp-2 mb-2"
                    >
                      {doc.title}
                      {doc.thumbnail && (
                        <span className="text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25}
                               stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
                          </svg>
                        </span>
                      )}
                    </div>
                    <div
                      className={`mb-4 text-sm wrap-break-word break-keep text-gray-500 dark:text-gray-300 line-clamp-2`}>
                      {doc.content}
                    </div>

                    <div className="flex items-center gap-2">

                      {doc.category ?
                        <div
                          className="relative text-gray-900 text-xs before:bg-gray-300">
                          {doc.category.title}
                        </div>
                        : ""}

                      <div
                        className="relative text-gray-900 dark:text-dark-100 text-xs before:bg-gray-300">
                        {doc.user?.nickName}
                      </div>
                      <div
                        className="relative text-gray-400 text-xs before:bg-gray-300">
                        {dayjs(doc.createdAt).fromNow()}
                      </div>
                      <div
                        className="relative flex gap-2 before:bg-gray-300">
                        <div className="text-xs text-gray-400">댓글</div>
                        <div className="text-xs text-gray-700">
                          {doc.commentCount}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="text-xs text-gray-400">조회수</div>
                        <div className="text-xs text-gray-700">
                          {doc.readCount}
                        </div>
                      </div>
                    </div>
                  </div>

                </Link>
                <div className="flex items-center w-full lg:w-1/4">
                  <div
                    className="flex-1 py-2 rounded-md ">
                    <div
                      className="flex items-center gap-4 lg:block pl-0 lg:px-4 lg:border-l border-gray-200 dark:border-dark-800">
                      <div className="flex items-center gap-2 mb-0 lg:mb-1">
                        <ChatBubbleOvalLeftEllipsisIcon className="size-5 stroke-1 text-gray-400"/>
                        <div className="text-xs lg:text-sm text-gray-900 dark:text-dark-100 line-clamp-1">
                          관리자
                        </div>
                        <div className="text-gray-500 text-xs">26분전</div>
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-1">
                        테스트용으로 작성된 댓글입니다. 테스트용으로 작성된
                      </div>
                    </div>
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
                className={`text-xs bg-gray-50 py-1.5 px-6 rounded-sm border border-gray-200 text-gray-800 hover:text-gray-950 hover:border-gray-900 focus:border-gray-900`}>글쓰기</Link>
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
