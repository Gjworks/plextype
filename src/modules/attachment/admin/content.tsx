"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Download, Eye, File, Trash2 } from "lucide-react";
import PageNavigation from "@/core/components/nav/PageNavigation";
import { removeAttachmentAdminAction } from "@/modules/attachment/actions/admin-content.action";
import type { AdminAttachmentListData } from "@/modules/attachment/actions/admin-content.type";
import { formatKstShortDateTime } from "@/core/utils/date/kst";

const sectionMeta = {
  attachments: {
    eyebrow: "Attachments",
    title: "첨부파일 관리",
    description:
      "회원별 업로드 파일, 이미지 사용 여부, 용량 현황을 확인합니다.",
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

const formatFileSize = (bytes: number) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const attachmentIconButtonClass =
  "inline-flex h-8 min-h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-950 hover:ring-4 hover:ring-gray-100/70 dark:border-dark-700 dark:bg-dark-900 dark:text-dark-300 dark:hover:border-dark-600 dark:hover:bg-dark-800 dark:hover:text-dark-100 dark:hover:ring-dark-800/35";

const attachmentDangerIconButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/20 bg-white text-red-500 transition-all duration-200 hover:bg-red-500/5 hover:ring-4 hover:ring-red-100/70 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-400/20 dark:bg-dark-900 dark:text-red-300 dark:hover:bg-red-400/10 dark:hover:ring-red-400/10";

const ContentAdmin = ({
  initialAttachments = [],
  navigation = defaultNavigation,
}: {
  initialAttachments?: AdminAttachmentListData["items"];
  navigation?: AdminAttachmentListData["navigation"];
}) => {
  const section = "attachments";

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
      const result = await removeAttachmentAdminAction(id);
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
              전체 {navigation.totalCount}개 중 최근 {initialAttachments.length}
              개를 표시하고 있습니다.
            </div>
          </div>

          {initialAttachments.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {initialAttachments.map((item) => {
                const isImage = item.mimeType.startsWith("image/");
                return (
                  <div
                    key={item.id}
                    className="group overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm shadow-gray-100 transition-colors hover:border-gray-200 hover:bg-gray-50 dark:border-dark-800 dark:bg-dark-900 dark:shadow-black/20 dark:hover:border-dark-700 dark:hover:bg-dark-800"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-dark-950">
                      {isImage ? (
                        <img
                          src={item.path}
                          alt={item.originalName}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
                          <File size={36} strokeWidth={1.5} />
                          <div className="mt-3 max-w-[80%] truncate text-xs font-semibold">
                            {item.mimeType}
                          </div>
                        </div>
                      )}

                      <div className="absolute left-3 top-3 rounded bg-white/90 px-2 py-1 text-[10px] font-bold text-gray-500 shadow-sm dark:bg-dark-950/85 dark:text-dark-300">
                        #{item.id}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="line-clamp-1 text-sm font-semibold text-gray-800 dark:text-dark-100">
                        {item.originalName}
                      </div>
                      <div className="mt-1 line-clamp-1 text-xs text-gray-400">
                        {item.fileName}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <div>
                          <div className="font-semibold text-gray-700 dark:text-dark-200">
                            {formatFileSize(item.size)}
                          </div>
                          <div className="mt-0.5 text-gray-400">용량</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-700 dark:text-dark-200">
                            {item.uploadedBy?.nickName ||
                              item.uploadedBy?.accountId ||
                              "알 수 없음"}
                          </div>
                          <div className="mt-0.5 text-gray-400">업로더</div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-dark-800">
                        <div className="text-xs text-gray-400">
                          {formatDate(item.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={item.path}
                            target="_blank"
                            rel="noreferrer"
                            className={attachmentIconButtonClass}
                            aria-label={`${item.originalName} 열기`}
                          >
                            <Eye size={14} />
                          </a>
                          <a
                            href={item.path}
                            download={item.originalName}
                            className={attachmentIconButtonClass}
                            aria-label={`${item.originalName} 다운로드`}
                          >
                            <Download size={14} />
                          </a>
                          <button
                            type="button"
                            disabled={isPending}
                            className={attachmentDangerIconButtonClass}
                            aria-label={`${item.originalName} 삭제`}
                            onClick={() =>
                              handleDelete(
                                "attachment",
                                item.id,
                                `"${item.originalName}" 첨부파일을 삭제합니다.`,
                              )
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-400 dark:border-dark-700 dark:bg-dark-900">
              조회된 첨부파일이 없습니다.
            </div>
          )}

          {navigation.totalPages > 0 && (
            <div className="mt-6 flex justify-center">
              <PageNavigation
                page={navigation.page}
                totalPages={navigation.totalPages}
                basePath="/admin/content/attachments"
              />
            </div>
          )}
        </div>
      }
    </div>
  );
};
export default ContentAdmin;
