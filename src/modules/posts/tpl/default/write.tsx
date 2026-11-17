"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";

import type { Attachment as IAttachment } from "@/modules/attachment/actions/_type";

// 그리고 컴포넌트는 원래대로 가져옵니다.
import { Attachment } from "src/modules/attachment";
import { usePostContext } from "./PostProvider";
import PostNotPermission from "@/modules/posts/tpl/default/notPermission";
import ExtraFieldRenderer from "@/modules/posts/tpl/default/ExtraFieldRenderer";
import TiptapEditor from "@components/editor/tiptap/tiptapEditor";
import { boardButton, boardFlat, boardInput, boardLabelCell, boardPrimaryButton, boardRowLine, boardTopLine } from "./boardStyles";

// 1. 프롭 타입 정의 (이게 빠지면 에러 납니다)
interface PostWriteProps {
  savePost: (formData: FormData) => Promise<any>;
  existingPost?: {
    id: number;
    categoryId: number | null;
    title: string | null;
    content: string | null;
    thumbnail?: string | null;
    extraFieldData?: any;
    isSecrets?: boolean | null;
  } | null;
}

const PostWrite: React.FC<PostWriteProps> = ({ savePost, existingPost }) => {
  const { postInfo, permissions } = usePostContext();
  const router = useRouter();
  // 2. 필수 상태 및 Ref 선언
  const formRef = useRef<HTMLFormElement | null>(null);
  const editorRef = useRef<any>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const categoryRef = useRef<HTMLSelectElement | null>(null);
  const secretPasswordRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [title, setTitle] = useState(existingPost?.title || "");
  const [content, setContent] = useState(existingPost?.content || "");
  const [thumbnail, setThumbnail] = useState(existingPost?.thumbnail || "");
  const [isSecrets, setIsSecrets] = useState(Boolean(existingPost?.isSecrets));
  const [extraData, setExtraData] = useState<any>({
    ...(existingPost?.extraFieldData || {}),
    notificationEnabled: existingPost?.extraFieldData?.notificationEnabled ?? true,
  });

  // 🌟 1. tempId 상태를 추가합니다. (신규 글 작성용)


  // 권한 체크
  if (!permissions.doWrite) return <PostNotPermission />;

  // 3. 저장 함수 (이게 정의되어 있어야 합니다)
  const handleSubmit = async (form: HTMLFormElement | null) => {
    if (!form || loading || !editorRef.current) return;

    setLoading(true);
    setFormMessage(null);
    setFieldErrors(null);
    try {
      const formData = new FormData(form);
      formData.set("isSecrets", isSecrets ? "true" : "false");

      // Tiptap 에디터에서 JSON 추출 (혹은 getHTML())
      const jsonContent = editorRef.current.getJSON();
      formData.append("content", JSON.stringify(jsonContent));
      if (extraData) {
        Object.entries(extraData).forEach(([key, value]) => {
          // 만약 서버가 'extraData__필드명' 형식을 기대한다면 아래처럼 보냅니다.
          formData.append(`extraData__${key}`, String(value));

          // 만약 서버가 그냥 '필드명' 그대로를 기대한다면 아래처럼 보냅니다.
          // formData.append(key, value as string);
        });
      }



      const res = await savePost(formData);

      if (res.success) {
        router.push(`/posts/${postInfo.mid}`);
        router.refresh(); // 목록 갱신
      } else {
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);

          if (res.fieldErrors.title) titleRef.current?.focus();
          else if (res.fieldErrors.categoryId) categoryRef.current?.focus();
          else if (res.fieldErrors.secretPassword || res.fieldErrors.isSecrets) secretPasswordRef.current?.focus();
          else if (res.fieldErrors.content) editorRef.current?.commands?.focus?.();
        } else {
          setFormMessage(res.message || "저장에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("저장 오류:", error);
      setFormMessage("시스템 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileDelete = (file: IAttachment) => {
    const editor = editorRef.current;
    if (!editor) return;

    // 🌟 Tiptap 에디터에서 해당 경로를 가진 이미지를 찾아 삭제하는 마법의 코드
    editor.commands.command(({ tr, state }) => {
      const { doc } = state;
      let posToDelete: number[] = [];

      // 본문을 훑으며 이미지 노드 중 src가 일치하는 위치(pos)를 모두 찾습니다.
      doc.descendants((node, pos) => {
        if (node.type.name === "image" && node.attrs.src === file.path) {
          posToDelete.push(pos);
        }
      });

      // 찾은 위치를 뒤에서부터 지웁니다 (앞에서 지우면 뒤쪽 인덱스가 밀리기 때문)
      posToDelete.reverse().forEach((pos) => {
        tr.delete(pos, pos + 1);
      });

      return true;
    });

    // 에디터 상태를 강제로 업데이트해서 usedFiles가 다시 계산되게 함
    setContent(editor.getHTML());
    if (thumbnail === file.path) setThumbnail("");
  };

  const rowClass = `flex flex-col sm:flex-row ${boardRowLine}`;
  const labelClass = `flex shrink-0 items-center px-4 py-2 sm:w-32 sm:py-3 ${boardLabelCell}`;
  const fieldClass = "min-w-0 flex-1 px-4 py-3";
  const errorClass = "mt-1.5 text-xs leading-5 text-red-500";
  const checkboxClass = "h-4 w-4 cursor-pointer rounded-sm border-gray-300 accent-gray-900 dark:border-dark-600 dark:accent-dark-200";
  const hasCategories = postInfo.categories && postInfo.categories.length > 0;

  return (
    <form ref={formRef} className={`w-full pb-16 pt-8 sm:pt-10 ${boardFlat}`} onSubmit={(event) => event.preventDefault()}>
      {/* 수정할 때는 글 ID를 함께 보낸다. */}
      {existingPost && <input type="hidden" name="id" value={existingPost.id} />}
      <input type="hidden" name="thumbnail" value={thumbnail} />

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pb-4">
        <h1 className="text-xl font-bold tracking-[-0.01em] text-gray-950 dark:text-dark-50 sm:text-2xl">{postInfo.moduleName}</h1>
        <p className="text-[13px] text-gray-500 dark:text-dark-400">{existingPost ? "글 수정" : "글쓰기"}</p>
      </div>

      {formMessage && (
        <div role="alert" className="mb-3 rounded-sm border border-red-200 bg-red-50 px-4 py-2.5 text-sm leading-6 text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
          {formMessage}
        </div>
      )}

      <div className={boardTopLine}>
        {hasCategories && (
          <div className={rowClass}>
            <label htmlFor="post-category" className={labelClass}>분류</label>
            <div className={fieldClass}>
              <select
                ref={categoryRef}
                id="post-category"
                name="categoryId"
                defaultValue={existingPost?.categoryId ?? ""}
                aria-invalid={Boolean(fieldErrors?.categoryId)}
                className={`${boardInput} sm:w-60`}
              >
                <option value="">분류 선택</option>
                {postInfo.categories.map((category: { id: number; title: string }) => (
                  <option key={category.id} value={category.id}>{category.title}</option>
                ))}
              </select>
              {fieldErrors?.categoryId && <p className={errorClass}>{fieldErrors.categoryId}</p>}
            </div>
          </div>
        )}

        <div className={rowClass}>
          <label htmlFor="post-title" className={labelClass}>제목</label>
          <div className={fieldClass}>
            <input
              ref={titleRef}
              id="post-title"
              type="text"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="제목을 입력해주세요."
              aria-invalid={Boolean(fieldErrors?.title)}
              className={boardInput}
            />
            {fieldErrors?.title && <p className={errorClass}>{fieldErrors.title}</p>}
          </div>
        </div>

        <div className={rowClass}>
          <span className={labelClass}>옵션</span>
          <div className={`${fieldClass} flex flex-wrap items-center gap-x-6 gap-y-2`}>
            {postInfo.config?.secretPost && (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800 dark:text-dark-100">
                <input type="checkbox" checked={isSecrets} onChange={(event) => setIsSecrets(event.target.checked)} className={checkboxClass} />
                비밀글
              </label>
            )}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800 dark:text-dark-100">
              <input
                type="checkbox"
                checked={extraData.notificationEnabled !== false}
                onChange={(event) => setExtraData((prev: any) => ({ ...prev, notificationEnabled: event.target.checked }))}
                className={checkboxClass}
              />
              댓글 알림 받기
            </label>
          </div>
        </div>

        {postInfo.config?.secretPost && isSecrets && (
          <div className={rowClass}>
            <label htmlFor="post-secret-password" className={labelClass}>비밀번호</label>
            <div className={fieldClass}>
              <input
                ref={secretPasswordRef}
                id="post-secret-password"
                type="password"
                name="secretPassword"
                autoComplete="new-password"
                placeholder={existingPost?.isSecrets ? "변경할 때만 새 비밀번호를 입력하세요." : "비밀글 비밀번호를 입력해주세요."}
                aria-invalid={Boolean(fieldErrors?.secretPassword || fieldErrors?.isSecrets)}
                className={`${boardInput} sm:w-80`}
              />
              <p className="mt-1.5 text-xs leading-5 text-gray-500 dark:text-dark-400">작성자와 관리자, 비밀번호를 입력한 사용자만 본문과 댓글을 볼 수 있습니다.</p>
              {(fieldErrors?.secretPassword || fieldErrors?.isSecrets) && <p className={errorClass}>{fieldErrors.secretPassword || fieldErrors.isSecrets}</p>}
            </div>
          </div>
        )}

        {postInfo.extraFields && postInfo.extraFields.length > 0 && (
          <div className={rowClass}>
            <span className={labelClass}>추가 항목</span>
            <div className={fieldClass}>
              <ExtraFieldRenderer fields={postInfo.extraFields} value={extraData} onChange={(newData) => setExtraData(newData)} />
            </div>
          </div>
        )}

        <div className={rowClass}>
          <span className={labelClass}>내용</span>
          <div className={`${fieldClass} min-h-[400px]`}>
            <TiptapEditor
              ref={editorRef}
              initialContent={existingPost?.content || ""}
              onChange={(html: string) => {
                setContent(html);
              }}
            />
            {fieldErrors?.content && <p className={errorClass}>{fieldErrors.content}</p>}
          </div>
        </div>

        <div className={rowClass}>
          <span className={labelClass}>첨부파일</span>
          <div className={fieldClass}>
            <Attachment.Box
              content={content}
              autoInsertImages={false}
              onFileAttach={(file) => {
                if (file.mimeType.startsWith("image/")) {
                  setThumbnail((current) => current || file.path);
                }
              }}
              selectedThumbnail={thumbnail}
              onFileClick={(file) => {
                const editor = editorRef.current;
                if (!editor) return;

                if (file.mimeType.startsWith("image/")) {
                  if (!thumbnail) setThumbnail(file.path);

                  // 이미지 뒤에 빈 문단을 하나 넣어 바로 이어서 쓸 수 있게 한다.
                  editor.chain()
                    .focus()
                    .insertContent([
                      { type: "image", attrs: { src: file.path, alt: file.name } },
                      { type: "paragraph" },
                    ])
                    .run();
                } else {
                  editor.chain().focus().insertContent(
                    `<a href="${file.path}" target="_blank" class="text-blue-600 underline">${file.name}</a> `
                  ).run();
                }
              }}
              onFileDelete={handleFileDelete}
              onThumbnailSelect={(file) => setThumbnail(file.path)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-2 pt-6">
        <button type="button" onClick={() => router.back()} disabled={loading} className={`${boardButton} min-w-24`}>취소</button>
        <button type="button" onClick={() => handleSubmit(formRef.current)} disabled={loading} className={`${boardPrimaryButton} min-w-24`}>
          {loading ? "저장 중..." : existingPost ? "수정 완료" : "등록"}
        </button>
      </div>
    </form>
  );
};

export default PostWrite;
