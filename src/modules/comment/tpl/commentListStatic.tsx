import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";
import { CommentWithChildren } from "@/modules/comment/actions/_type";
import CommentItemActions from "./commentItemActions";

dayjs.extend(relativeTime);
dayjs.locale("ko");

interface CommentListStaticProps {
  documentId: number;
  comments: CommentWithChildren[];
  currentUser: any;
  canReply: boolean;
  upsertComment: (args: {
    documentId: number;
    content: string;
    parentId?: number;
    commentId?: number;
    options?: { deleted?: boolean; remove?: boolean };
  }) => Promise<any>;
  className?: string;
}

const CommentListStatic = ({ documentId, comments, currentUser, canReply, upsertComment, className = "" }: CommentListStaticProps) => {
  const renderComments = (items: CommentWithChildren[], depth = 0, parentUserName?: string) => {
    return items.map((comment, index) => {
      const canManage = currentUser?.isAdmin || currentUser?.id === comment.userId;
      const isLast = index === items.length - 1;

      return (
        <article key={`${comment.id}-${comment.uuid}`} id={`comment-${comment.id}`} className="relative">
          {comment.children && comment.children.length > 0 && (
            <div className="absolute left-[19px] top-10 bottom-0 w-[1px] bg-gray-100 dark:bg-gray-800 z-0" />
          )}

          <div className={`relative flex items-start ${depth > 0 ? "ml-10 mb-6" : "mb-8"}`}>
            {depth > 0 && (
              <div
                className={`absolute left-[-21px] w-[21px] z-0 border-gray-100 dark:border-gray-800 ${
                  isLast
                    ? "top-[-32px] h-[52px] border-l-[1px] border-b-[1px] rounded-bl-xl"
                    : "top-[-32px] h-[52px] border-l-[1px] border-b-[1px] rounded-bl-xl"
                }`}
              />
            )}

            <div className="relative shrink-0 z-10">
              <div
                className={`flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-dark-900 ${
                  depth > 0 ? "w-7 h-7" : "w-10 h-10"
                }`}
                aria-hidden="true"
              >
                <span className={`font-bold text-gray-400 uppercase ${depth > 0 ? "text-[10px]" : "text-xs"}`}>
                  {comment.userName?.slice(0, 1) || "익"}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0 ml-3">
              <div className="group relative transition-all duration-200">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{comment.userName || "익명"}</span>
                    <time className="text-[10px] text-gray-400" dateTime={String(comment.createdAt)}>
                      {dayjs(comment.createdAt).fromNow()}
                    </time>
                  </div>

                  <CommentItemActions
                    documentId={documentId}
                    comment={comment}
                    canManage={canManage}
                    canReply={canReply}
                    variant="manage"
                    upsertComment={upsertComment}
                  />
                </div>

                <div className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed mb-2 whitespace-pre-wrap">
                  {comment.depth > 1 && parentUserName && (
                    <span className="text-blue-500 font-bold mr-1.5 opacity-80">@{parentUserName}</span>
                  )}
                  {comment.isDeleted ? <span className="text-gray-300 italic text-xs">삭제된 댓글입니다.</span> : comment.content}
                </div>

                <CommentItemActions
                  documentId={documentId}
                  comment={comment}
                  canManage={canManage}
                  canReply={canReply}
                  upsertComment={upsertComment}
                />
              </div>
            </div>
          </div>

          {comment.children?.length > 0 && renderComments(comment.children, depth + 1, comment.userName ?? undefined)}
        </article>
      );
    });
  };

  return (
    <section className={`max-w-screen-md mx-auto px-2 pt-16 ${className}`} aria-label="댓글 목록">
      <h2 className="sr-only">댓글</h2>
      {comments.length > 0 ? renderComments(comments) : (
        <p className="text-sm text-gray-400">아직 댓글이 없습니다.</p>
      )}
    </section>
  );
};

export default CommentListStatic;
