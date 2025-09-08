"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PostsHeader from "./header";
import { getPostsAction } from "src/extentions/posts/scripts/actions/getPostsAction";

import {
  HomeIcon,
  ChevronRightIcon,
  ChatBubbleOvalLeftEllipsisIcon,
} from "@heroicons/react/24/outline";
import PageNavigation from "@plextype/components/nav/PageNavigation";

interface CurrentUser {
  id: number;
  accountId: string;
  isAdmin: boolean;
  groups: number[];
  loggedIn: boolean;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
}

interface PostsListClientProps {
  posts: {
    id: number;
    title: string | null;
    content: string | null;
    createdAt: string; // 직렬화해야 클라이언트에서 사용 가능
    updatedAt: string;
    isNotice: boolean | null;
    isSecrets: boolean | null;
    readCount: number | null;
    commentCount: number | null;
    voteCount: number | null;
    user?: {
      id: number;
      nickName: string;
    } | null;
  }[];
  postInfo: {
    id: number;
    pid: string;
    postName: string;
    postDesc?: string | null;
  };
  currentUser?: CurrentUser | null; // ✅ 추가
  pagination: Pagination
}

const PostsListClient: React.FC<PostsListClientProps> = ({
  posts,
  postInfo,pagination: initialPagination
}) => {
  const router = useRouter();
  const [documentInfo, setDocumentInfo] = useState(posts);
  const [pagination, setPagination] = useState(initialPagination);
  const [page, setPage] = useState(pagination.currentPage);

  const handlePageChange = async (newPage: number) => {
    setPage(newPage);

    // SPA처럼 서버 액션 호출
    const { items, pagination: newPagination } = await getPostsAction(postInfo.pid, newPage, pagination.pageSize);
    setDocumentInfo(items);
    setPagination(newPagination);
    router.replace(`/posts/${postInfo.pid}?page=${newPage}`, { scroll: false });
  };

  return (
      <>
        <PostsHeader/>
        <div className="border-t border-gray-200 dark:border-dark-700">
          {documentInfo.map((doc) => (
              <div
                  key={doc.id}
                  className="flex flex-wrap gap-4 lg:gap-2 border-b border-gray-200 dark:border-dark-700 py-4 lg:py-8"
              >
                <div className="flex-1">
                  <Link
                      href={`/posts/${postInfo.pid}/view/${doc.id}`}
                      className="text-sm lg:text-xl font-medium text-gray-950 dark:text-white hover:underline line-clamp-2 mb-2"
                  >
                    {doc.title}
                  </Link>

                  <div className="flex items-center">
                    <div
                        className="relative text-primary-500 pr-3 text-xs lg:text-sm before:absolute before:h-[12px] before:w-[1px] before:right-0 before:top-[4px] before:bg-gray-300">
                      질문답변
                    </div>
                    <div
                        className="relative text-gray-900 dark:text-dark-100 text-xs lg:text-sm px-3 before:absolute before:h-[12px] before:w-[1px] before:right-0 before:top-[4px] before:bg-gray-300">
                      {doc.user?.nickName}
                    </div>
                    <div
                        className="relative text-gray-500 text-xs lg:text-sm px-3 before:absolute before:h-[12px] before:w-[1px] before:right-0 before:top-[4px] before:bg-gray-300">
                      3일전
                    </div>
                    <div
                        className="relative flex gap-2 px-3 before:absolute before:h-[12px] before:w-[1px] before:right-0 before:top-[4px] before:bg-gray-300">
                      <div className="text-xs lg:text-sm text-gray-400">댓글</div>
                      <div className="text-xs lg:text-sm text-gray-700">
                        {doc.commentCount}
                      </div>
                    </div>
                    <div className="flex gap-2 px-3">
                      <div className="text-xs lg:text-sm text-gray-400">조회수</div>
                      <div className="text-xs lg:text-sm text-gray-700">
                        {doc.readCount}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center w-full lg:w-1/5">
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
            <Link href={`/posts/${postInfo.pid}/create`}>글쓰기</Link>
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
