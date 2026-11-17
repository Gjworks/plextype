"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import TiptapEditor from "@components/editor/tiptap/tiptapEditor";
import { Attachment } from "@/modules/attachment";
import type { Attachment as IAttachment } from "@/modules/attachment/actions/_type";
import { boardButton, boardFlat, boardPrimaryButton } from "@/modules/posts/tpl/default/boardStyles";

export type UpsertComment = (args: {
  documentId: number;
  content: string;
  parentId?: number;
  commentId?: number;
  notificationEnabled?: boolean;
  options?: { deleted?: boolean; remove?: boolean };
}) => Promise<{ success: boolean; message?: string }>;

interface CommentFormProps {
  documentId: number;
  // new: 새 댓글, reply: parentId에 다는 답글, edit: commentId의 내용 수정
  mode: "new" | "reply" | "edit";
  parentId?: number;
  commentId?: number;
  initialContent?: string;
  upsertComment: UpsertComment;
  onDone?: () => void;
  onCancel?: () => void;
}

const failureMessage = { new: "댓글 등록에 실패했습니다.", reply: "답글 등록에 실패했습니다.", edit: "댓글 수정에 실패했습니다." };
const submitLabel = { new: "등록", reply: "답글 등록", edit: "수정" };

const CommentForm = ({ documentId, mode, parentId, commentId, initialContent = "", upsertComment, onDone, onCancel }: CommentFormProps) => {
  const router = useRouter();
  const editorRef = useRef<any>(null);
  const [content, setContent] = useState("");
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const editor = editorRef.current;
    if (!editor || editor.isEmpty || loading) return;

    setLoading(true);
    setMessage(null);
    try {
      const result = await upsertComment({
        documentId,
        content: JSON.stringify(editor.getJSON()),
        parentId: mode === "reply" ? parentId : undefined,
        commentId: mode === "edit" ? commentId : undefined,
        notificationEnabled: mode === "edit" ? undefined : notificationEnabled,
      });
      if (!result.success) {
        setMessage(result.message || failureMessage[mode]);
        return;
      }
      editor.commands.clearContent();
      setContent("");
      onDone?.();
      router.refresh();
    } catch {
      setMessage(failureMessage[mode]);
    } finally {
      setLoading(false);
    }
  };

  // 첨부 목록에서 지운 이미지는 본문에서도 함께 지운다.
  const handleFileDelete = (file: IAttachment) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.commands.command(({ tr, state }: any) => {
      const positions: number[] = [];
      state.doc.descendants((node: any, pos: number) => {
        if (node.type.name === "image" && node.attrs.src === file.path) positions.push(pos);
      });
      positions.reverse().forEach((pos) => tr.delete(pos, pos + 1));
      return true;
    });
    setContent(editor.getHTML());
  };

  return (
    <form onSubmit={handleSubmit} className={`border border-gray-300 bg-white dark:border-dark-700 dark:bg-dark-950 ${boardFlat}`}>
      <TiptapEditor
          ref={editorRef}
          frame="plain"
          initialContent={mode === "edit" ? initialContent : ""}
          variant="compact"
          onChange={(html: string) => setContent(html)}
        />
      <div className="border-t border-gray-200 px-3 py-3 dark:border-dark-800">
        <Attachment.Box
          content={content}
          onFileClick={(file) => {
            const editor = editorRef.current;
            if (!editor) return;
            if (file.mimeType.startsWith("image/")) {
              editor.chain().focus().insertContent([
                { type: "image", attrs: { src: file.path, alt: file.name } },
                { type: "paragraph" },
              ]).run();
            } else {
              editor.chain().focus().insertContent(
                `<a href="${file.path}" target="_blank" class="text-blue-600 underline">${file.name}</a> `
              ).run();
            }
          }}
          onFileDelete={handleFileDelete}
        />
      </div>
      {message && <p role="alert" className="px-3 pb-2 text-xs leading-5 text-red-500">{message}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-3 py-2 dark:border-dark-800 dark:bg-dark-900">
        {mode === "edit" ? <span /> : (
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-gray-700 dark:text-dark-200">
            <input
              type="checkbox"
              checked={notificationEnabled}
              onChange={(event) => setNotificationEnabled(event.target.checked)}
              className="h-4 w-4 cursor-pointer rounded-sm border-gray-300 accent-gray-900 dark:border-dark-600 dark:accent-dark-200"
            />
            {mode === "reply" ? "답글 알림 받기" : "댓글 알림 받기"}
          </label>
        )}
        <div className="flex gap-1.5">
          {onCancel && <button type="button" onClick={onCancel} disabled={loading} className={boardButton}>취소</button>}
          <button type="submit" disabled={loading || !content.trim()} className={boardPrimaryButton}>
            {loading ? "저장 중..." : submitLabel[mode]}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;
