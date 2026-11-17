"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CommentForm, { type UpsertComment } from "./commentForm";

interface CommentRowActionsProps {
  documentId: number;
  comment: { id: number; content: string; isDeleted?: boolean | null; hasChildren: boolean };
  canManage: boolean;
  canReply: boolean;
  upsertComment: UpsertComment;
}

const linkClass = "cursor-pointer text-xs text-gray-500 hover:text-gray-950 hover:underline dark:text-dark-400 dark:hover:text-white";

// 댓글 아래의 답글·수정·삭제 링크. 답글과 수정은 그 댓글 바로 아래에 입력 칸을 편다.
const CommentRowActions = ({ documentId, comment, canManage, canReply, upsertComment }: CommentRowActionsProps) => {
  const router = useRouter();
  const [mode, setMode] = useState<"reply" | "edit" | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (comment.isDeleted) return null;
  const showReply = canReply;
  if (!showReply && !canManage) return null;

  const handleDelete = async () => {
    if (deleting || !window.confirm("댓글을 삭제하시겠습니까?")) return;
    setDeleting(true);
    try {
      // 답글이 달린 댓글은 자리를 남기고 내용만 지운다.
      const result = await upsertComment({
        documentId,
        content: "",
        commentId: comment.id,
        options: { deleted: comment.hasChildren, remove: !comment.hasChildren },
      });
      if (!result.success) {
        window.alert(result.message || "댓글 삭제에 실패했습니다.");
        return;
      }
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  const toggle = (next: "reply" | "edit") => setMode((current) => (current === next ? null : next));

  return (
    <>
      <div className="mt-2 flex items-center gap-3">
        {showReply && <button type="button" onClick={() => toggle("reply")} aria-expanded={mode === "reply"} className={linkClass}>답글</button>}
        {canManage && <button type="button" onClick={() => toggle("edit")} aria-expanded={mode === "edit"} className={linkClass}>수정</button>}
        {canManage && <button type="button" onClick={handleDelete} disabled={deleting} className={`${linkClass} hover:!text-red-600 dark:hover:!text-red-300`}>삭제</button>}
      </div>
      {mode && (
        <div className="mt-3">
          <CommentForm
            key={mode}
            documentId={documentId}
            mode={mode}
            parentId={comment.id}
            commentId={comment.id}
            initialContent={comment.content}
            upsertComment={upsertComment}
            onDone={() => setMode(null)}
            onCancel={() => setMode(null)}
          />
        </div>
      )}
    </>
  );
};

export default CommentRowActions;
