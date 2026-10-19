"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Eye, Trash2 } from "lucide-react";
import PageNavigation from "@/core/components/nav/PageNavigation";
import { removeCommentAdminAction } from "@/modules/comment/actions/admin-content.action";
import type { AdminCommentListData } from "@/modules/comment/actions/admin-content.type";
import { formatKstShortDateTime } from "@/core/utils/date/kst";

const sectionMeta = {
  comments: {
    eyebrow: "Comments",
    title: "댓글 관리",
    description:
      "전체 댓글과 답글을 통합 조회하고 삭제, 복구, 작성자 기준 확인을 처리합니다.",
  },
};

const defaultNavigation = {
  totalCount: 0,
  totalPages: 0,
  page: 1,
  listCount: 0,
};

const formatDate = (date: Date | string) => {
  return formatKstShortDateTime(date);
};

const attachmentIconButtonClass =
  "inline-flex h-8 min-h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-950 hover:ring-4 hover:ring-gray-100/70 dark:border-dark-700 dark:bg-dark-900 dark:text-dark-300 dark:hover:border-dark-600 dark:hover:bg-dark-800 dark:hover:text-dark-100 dark:hover:ring-dark-800/35";

const contentDangerButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-white px-3.5 text-xs font-medium text-red-500 transition-all duration-200 hover:bg-red-500/5 hover:ring-4 hover:ring-red-100/70 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-400/20 dark:bg-dark-900 dark:text-red-300 dark:hover:bg-red-400/10 dark:hover:ring-red-400/10";

const ContentAdmin = ({
  initialComments = [],
  navigation = defaultNavigation,
}: {
  initialComments?: AdminCommentListData["items"];
  navigation?: AdminCommentListData["navigation"];
}) => {
  const section = "comments";

  const meta = sectionMeta[section];

  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const handleDelete = (
    type: "document" | "comment" | "attachment",
    id: number,
    label: string,
  ) => {
    const messages = {
      document: "게시글을 삭제하면 연결된 댓글도 함께 삭제될 수 있습니다.",
      comment: "댓글을 삭제하시겠습니까?",
      attachment: "첨부파일을 삭제하면 실제 파일도 함께 삭제됩니다.",
    };
    if (!window.confirm(`${label}\n${messages[type]}`)) return;
    startTransition(async () => {
      const result = await removeCommentAdminAction(id);
      if (!result.success) {
        window.alert(result.message || "삭제에 실패했습니다.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-3 py-8 md:px-5 md:py-10 dark:text-dark-100">
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {meta.eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-dark-100">
          {meta.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
          {meta.description}
        </p>
      </div>

      {
        <div>
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="text-sm text-gray-400">
              전체 {navigation.totalCount}개 중 최근 {initialComments.length}
              개를 표시하고 있습니다.
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm shadow-gray-100 dark:border-dark-800 dark:bg-dark-900 dark:shadow-black/20">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 dark:border-dark-800 dark:bg-dark-950/70">
                    <th className="w-16 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      ID
                    </th>
                    <th className="w-36 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Board
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Comment
                    </th>
                    <th className="w-52 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Document
                    </th>
                    <th className="w-32 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Author
                    </th>
                    <th className="w-28 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Status
                    </th>
                    <th className="w-32 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Created
                    </th>
                    <th className="w-20 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      View
                    </th>
                    <th className="w-24 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Delete
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {initialComments.length > 0 ? (
                    initialComments.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 transition-colors last:border-b-0 hover:bg-gray-100/70 dark:border-dark-800 dark:hover:bg-white/[0.04]"
                      >
                        <td className="px-4 py-4 text-sm font-medium text-gray-400">
                          {item.id}
                        </td>
                        <td className="px-4 py-4">
                          <div className="inline-flex rounded-md bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600 dark:bg-dark-800 dark:text-dark-300">
                            {item.document.module.mid}
                          </div>
                          <div className="mt-1 truncate text-xs text-gray-400">
                            {item.document.module.moduleName}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="line-clamp-2 text-sm font-medium leading-6 text-gray-700 dark:text-dark-200">
                            {item.content}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.depth > 0 && (
                              <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-dark-800 dark:text-dark-300">
                                답글
                              </span>
                            )}
                            {item.isSecret && (
                              <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                                비밀댓글
                              </span>
                            )}
                            {item.isDeleted && (
                              <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-500">
                                삭제됨
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/posts/${item.document.module.mid}/${item.document.slug}`}
                            className="line-clamp-2 text-sm font-semibold text-gray-800 transition-colors hover:text-primary-600 dark:text-dark-100 dark:hover:text-primary-300"
                          >
                            {item.document.title || "제목 없음"}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {item.user?.nickName ||
                            item.user?.accountId ||
                            "비회원"}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-600 dark:text-dark-300">
                            {item.status || "normal"}
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            {item.parentId ? "reply" : "root"}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Link
                            href={`/posts/${item.document.module.mid}/${item.document.slug}`}
                            className={attachmentIconButtonClass}
                            aria-label={`${item.document.title || "게시글"} 보기`}
                          >
                            <Eye size={14} />
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            disabled={isPending}
                            className={contentDangerButtonClass}
                            onClick={() =>
                              handleDelete(
                                "comment",
                                item.id,
                                `#${item.id} 댓글을 삭제합니다.`,
                              )
                            }
                          >
                            <Trash2 size={14} />
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-16 text-center text-sm text-gray-400"
                      >
                        조회된 댓글이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {navigation.totalPages > 0 && (
            <div className="mt-6 flex justify-center">
              <PageNavigation
                page={navigation.page}
                totalPages={navigation.totalPages}
                basePath="/admin/content/comments"
              />
            </div>
          )}
        </div>
      }
    </div>
  );
};
export default ContentAdmin;
