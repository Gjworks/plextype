import Link from "next/link";
import { CornerDownRight } from "lucide-react";
import type { CommentWithChildren } from "@/modules/comment/actions/_type";
import { toKstDayjs } from "@/core/utils/date/kst";
import { boardRowLine, boardTopLine } from "@/modules/posts/tpl/default/boardStyles";
import CommentContent from "./commentContent";
import CommentForm, { type UpsertComment } from "./commentForm";
import CommentRowActions from "./commentRowActions";

// 기본 스킨의 댓글 화면: 줄 단위 목록, 페이지 이동, 아래쪽의 댓글 쓰기 칸.
interface CommentBoardProps {
  documentId: number;
  // 댓글 페이지 링크를 만들 본문 주소. 예: /posts/notice/abc123
  basePath: string;
  comments: CommentWithChildren[];
  pagination: { totalCount: number; totalPages: number; currentPage: number; pageSize: number };
  currentUser: any;
  canReply: boolean;
  upsertComment: UpsertComment;
}

// 답글은 한 단계만 들여 쓰고, 더 깊은 답글은 누구에게 단 것인지 이름으로 알린다.
const MAX_INDENT_DEPTH = 1;

const CommentBoard = ({ documentId, basePath, comments, pagination, currentUser, canReply, upsertComment }: CommentBoardProps) => {
  const renderComments = (items: CommentWithChildren[], depth = 0, parentUserName?: string): React.ReactNode =>
    items.map((comment) => {
      const canManage = Boolean(currentUser?.isAdmin || (currentUser?.id && currentUser.id === comment.userId));
      const isReply = depth > 0;
      return (
        <div key={`${comment.id}-${comment.uuid}`}>
          <article
            id={`comment-${comment.id}`}
            className={`flex gap-2 px-4 py-4 ${boardRowLine} ${isReply ? "bg-gray-50/70 dark:bg-dark-900/50" : ""}`}
            style={isReply ? { paddingLeft: `${16 + Math.min(depth, MAX_INDENT_DEPTH) * 20}px` } : undefined}
          >
            {isReply && <CornerDownRight size={14} aria-hidden="true" className="mt-1 shrink-0 text-gray-400 dark:text-dark-500" />}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span className="text-[13px] font-semibold text-gray-900 dark:text-dark-100">{comment.userName || "익명"}</span>
                <time dateTime={String(comment.createdAt)} className="text-xs tabular-nums text-gray-500 dark:text-dark-400">
                  {toKstDayjs(comment.createdAt)?.format("YYYY.MM.DD HH:mm")}
                </time>
              </div>
              <div className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-gray-800 dark:text-dark-200">
                {comment.isDeleted ? (
                  <span className="text-[13px] text-gray-400 dark:text-dark-500">삭제된 댓글입니다.</span>
                ) : (
                  <>
                    {depth > MAX_INDENT_DEPTH && parentUserName && <span className="mr-1.5 font-semibold text-gray-500 dark:text-dark-300">@{parentUserName}</span>}
                    <CommentContent content={comment.content} />
                  </>
                )}
              </div>
              <CommentRowActions
                documentId={documentId}
                comment={{ id: comment.id, content: comment.content, isDeleted: comment.isDeleted, hasChildren: Boolean(comment.children?.length) }}
                canManage={canManage}
                canReply={canReply}
                upsertComment={upsertComment}
              />
            </div>
          </article>
          {comment.children?.length > 0 && renderComments(comment.children, depth + 1, comment.userName ?? undefined)}
        </div>
      );
    });

  const pages = Array.from({ length: pagination.totalPages }, (_, index) => index + 1);

  return (
    <section id="comments" aria-label="댓글" className="mx-auto w-full max-w-screen-lg scroll-mt-24 px-3 pb-16 pt-10">
      <h2 className="pb-3 text-base font-bold text-gray-950 dark:text-dark-50">
        댓글 <span className="tabular-nums text-primary-600 dark:text-primary-400">{pagination.totalCount.toLocaleString()}</span>
      </h2>

      <div className={boardTopLine}>
        {comments.length > 0 ? renderComments(comments) : (
          <p className={`px-4 py-10 text-center text-sm text-gray-500 dark:text-dark-400 ${boardRowLine}`}>등록된 댓글이 없습니다.</p>
        )}
      </div>

      {pages.length > 1 && (
        <nav aria-label="댓글 페이지" className="flex flex-wrap justify-center gap-1 pt-4">
          {pages.map((page) => (
            <Link
              key={page}
              href={`${basePath}?page=${page}#comments`}
              aria-current={page === pagination.currentPage ? "page" : undefined}
              className={`inline-flex h-8 min-w-8 items-center justify-center rounded-sm border px-2 text-[13px] tabular-nums ${page === pagination.currentPage ? "border-gray-900 bg-gray-900 font-semibold text-white dark:border-dark-100 dark:bg-dark-100 dark:text-dark-950" : "border-gray-300 text-gray-600 hover:text-gray-950 dark:border-dark-700 dark:text-dark-300 dark:hover:text-white"}`}
            >
              {page}
            </Link>
          ))}
        </nav>
      )}

      <div className="pt-6">
        <h3 className="pb-2 text-[13px] font-semibold text-gray-900 dark:text-dark-100">댓글 쓰기</h3>
        {canReply ? (
          <CommentForm documentId={documentId} mode="new" upsertComment={upsertComment} />
        ) : (
          <p className="border border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:border-dark-700 dark:bg-dark-900 dark:text-dark-400">
            {currentUser?.loggedIn === false || !currentUser?.id ? "로그인 후 댓글을 쓸 수 있습니다." : "이 게시판은 댓글 작성 권한이 필요합니다."}
          </p>
        )}
      </div>
    </section>
  );
};

export default CommentBoard;
