"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";
import { CircleDot, MessageSquare, Plus, SearchCode } from "lucide-react";

import { getDocumentList } from "@/modules/document/actions/document.action";
import Button from "@components/button/Button";
import PageNavigation from "@components/nav/PageNavigation";
import PostNotPermission from "@/modules/posts/tpl/default/notPermission";
import { usePostContext } from "@/modules/posts/tpl/default/PostProvider";

dayjs.extend(relativeTime);
dayjs.locale("ko");

interface Pagination {
  page: number;
  totalPages: number;
  listCount: number;
  totalCount: number;
}

const getIssueStatus = (doc: any) => {
  return doc.extraFieldData?.status || doc.extraFieldData?.issueStatus || doc.category?.title || "open";
};

const getIssuePriority = (doc: any) => {
  return doc.extraFieldData?.priority || doc.extraFieldData?.severity || "normal";
};

const statusClassName = (status: string) => {
  const normalized = status.toLowerCase();

  if (["closed", "done", "resolved", "완료"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (["progress", "in_progress", "진행중"].includes(normalized)) {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (["blocked", "hold", "보류"].includes(normalized)) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-gray-200 bg-gray-50 text-gray-600";
};

const priorityClassName = (priority: string) => {
  const normalized = priority.toLowerCase();

  if (["high", "critical", "urgent", "높음", "긴급"].includes(normalized)) {
    return "text-rose-600";
  }

  if (["low", "낮음"].includes(normalized)) {
    return "text-gray-400";
  }

  return "text-amber-600";
};

const IssueTrackerList = ({
  posts,
  pagination: initialPagination,
}: {
  posts: any[];
  pagination: Pagination;
}) => {
  const router = useRouter();
  const [documentInfo, setDocumentInfo] = useState(posts);
  const [pagination, setPagination] = useState(initialPagination);
  const [page, setPage] = useState(initialPagination.page);
  const { postInfo, permissions } = usePostContext();

  useEffect(() => {
    setDocumentInfo(posts);
    setPagination(initialPagination);
    setPage(initialPagination.page);
  }, [posts, initialPagination]);

  if (!permissions.doList) return <PostNotPermission />;

  const handlePageChange = async (newPage: number) => {
    setPage(newPage);

    const res = await getDocumentList(postInfo.mid, newPage, 10);
    if (res.success && res.data) {
      setDocumentInfo(res.data.documentList);
      setPagination(res.data.navigation);
    }

    router.replace(`/posts/${postInfo.mid}?page=${newPage}`, { scroll: false });
  };

  return (
    <section className="pb-20">
      <div className="border-b border-gray-200 py-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
              <SearchCode size={14} />
              Issue Tracker
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-gray-950 dark:text-white">
              {postInfo.moduleName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span>전체 {pagination.totalCount}</span>
              <span>현재 {pagination.listCount}</span>
              <span>페이지 {pagination.page} / {pagination.totalPages}</span>
            </div>
          </div>

          <Link href={`/posts/${postInfo.mid}/create`}>
            <Button type="button" className="px-4">
              <span className="inline-flex items-center gap-2">
                <Plus size={15} />
                새 이슈
              </span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {documentInfo.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            등록된 이슈가 없습니다.
          </div>
        ) : (
          documentInfo.map((doc) => {
            const status = getIssueStatus(doc);
            const priority = getIssuePriority(doc);

            return (
              <article key={doc.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                <div className="grid gap-4 px-2 py-4 lg:grid-cols-[1fr_220px] lg:items-center">
                  <Link href={`/posts/${postInfo.mid}/${doc.slug}`} className="min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 shrink-0 text-gray-300">
                        <CircleDot size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClassName(String(status))}`}>
                            {String(status)}
                          </span>
                          <span className={`text-[11px] font-semibold uppercase ${priorityClassName(String(priority))}`}>
                            {String(priority)}
                          </span>
                          <span className="text-[11px] text-gray-400">#{doc.id}</span>
                        </div>

                        <h2 className="mt-2 line-clamp-1 text-sm font-semibold text-gray-950 dark:text-white">
                          {doc.title}
                        </h2>

                        <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-gray-300">
                          {doc.content || "본문 미리보기가 없습니다."}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-[10px] font-semibold text-gray-400">
                              {doc.user?.profile?.profileImage ? (
                                <img
                                  src={doc.user.profile.profileImage}
                                  alt={doc.user?.nickName || "작성자"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                doc.user?.nickName?.slice(0, 1).toUpperCase() || "작"
                              )}
                            </span>
                            {doc.user?.nickName || "작성자"}
                          </span>
                          <span>{dayjs(doc.createdAt).fromNow()}</span>
                          <span>조회 {doc.readCount || 0}</span>
                          <span>댓글 {doc.commentCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="min-w-0 lg:border-l lg:border-gray-100 lg:pl-4">
                    {doc.latestComment ? (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {doc.latestComment.image ? (
                          <Image
                            src={doc.latestComment.image}
                            alt="댓글 이미지"
                            width={28}
                            height={28}
                            className="h-7 w-7 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <MessageSquare size={15} className="shrink-0 text-gray-300" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium text-gray-600">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-[10px] font-semibold text-gray-400">
                                  {doc.latestComment.user?.profile?.profileImage ? (
                                    <img
                                      src={doc.latestComment.user.profile.profileImage}
                                      alt={doc.latestComment.user?.nickName || "익명"}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    doc.latestComment.user?.nickName?.slice(0, 1).toUpperCase() || "익"
                                  )}
                                </span>
                                {doc.latestComment.user?.nickName || "익명"}
                              </span>
                            </span>
                            <span className="shrink-0 text-gray-400">
                              {dayjs(doc.latestComment.createdAt).fromNow()}
                            </span>
                          </div>
                          <p className="line-clamp-1 text-gray-400">
                            {doc.latestComment.content}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="hidden text-xs text-gray-300 lg:block">최근 댓글 없음</div>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="pt-10">
        <div className="flex justify-center">
          <PageNavigation
            page={page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </section>
  );
};

export default IssueTrackerList;
