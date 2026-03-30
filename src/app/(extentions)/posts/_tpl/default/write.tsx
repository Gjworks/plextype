"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ActionState } from "@extentions/posts/_actions/_type";
import TiptapEditor from "@components/editor/tiptap/tiptapEditor";
import UploadFileManager from "@components/editor/UploadFileManager";
import PostAttachmentList from "./PostAttachmentList";
import { usePostContext } from "./PostProvider";
import PostNotPermission from "@extentions/posts/_tpl/default/notPermission";
import Popup from "@components/modal/Popup";
import Button from "@components/button/Button";
import MyFiles from "./myFiles"
import {linkFileToSession} from "@extentions/posts/_actions/attachment.action"
import ExtraFieldRenderer from "./ExtraFieldRenderer";

interface PostWriteProps {
  savePost: (formData: FormData) => Promise<ActionState<number>>;
  existingPost?: {
    id: number;
    categoryId: number | null;
    title: string | null;
    content: string | null; // DB에 JSON string이라면 string | null
    extraFieldData?: any;
  } | null;
}
export interface Attachment {
  id: number;
  uuid: string;
  name: string;
  size: number;
  path: string;
  mimeType: string;
}

const PostWrite: React.FC<PostWriteProps> = ({ savePost, existingPost }) => {
  const { postInfo } = usePostContext();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null); // ✅ formRef 생성
  const [title, setTitle] = useState(existingPost?.title || "");
  const [tempId, setTempId] = useState<string | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const editorRef = useRef<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const closePopup = (close) => {
    setShowPopup(close);
  };
  const [content, setContent] = useState<string>(() => {
    if (!existingPost?.content) return "";

    // 만약 데이터가 '{'로 시작하면 EditorJS 데이터일 확률이 높음
    if (existingPost.content.startsWith("{")) {
      try {
        // JSON 데이터를 HTML로 변환하는 로직이 필요하거나,
        // 혹은 이번 기회에 데이터를 HTML로 마이그레이션해야 합니다.
        return ""; // 우선 빈 값으로 두거나 변환 로직 연결
      } catch {
        return existingPost.content;
      }
    }
    return existingPost.content;
  });

  const { permissions } = usePostContext();

  if (!permissions.doWrite) {
    return <PostNotPermission />;
  }

  // 3. handleContentChange 함수도 타입을 string으로 변경
  const handleContentChange = (html: string) => {
    setContent(html);
  };

  const handleLoadImages = () => {
    setShowPopup(true);
  }

  const handleSubmit = async (form: HTMLFormElement | null) => {
    if (!form || loading || !editorRef.current) return;

    setLoading(true);
    try {
      const formData = new FormData(form);
      const jsonContent = editorRef.current.getJSON();
      formData.append("content", JSON.stringify(jsonContent));

      // 🌟 이제 res에 { success, message, data }가 담깁니다!
      const res = await savePost(formData);

      if (res.success) {
        alert(res.message || "저장되었습니다.");
        // 목록으로 이동 (postInfo.pid 사용)
        router.push(`/posts/${postInfo.pid}`);
      } else {
        alert(res.message || "저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("저장 오류:", error);
      alert("시스템 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file: Attachment) => {
    const editor = editorRef.current;

    // 에디터 인스턴스가 없거나 준비되지 않았으면 중단
    if (!editor) {
      console.warn("에디터가 아직 준비되지 않았습니다.");
      return;
    }

    if (file.mimeType.startsWith("image/")) {
      // 이미지 삽입
      editor.chain().focus().setImage({ src: file.path }).run();
    } else if (file.mimeType.startsWith("video/")) {
      // 비디오 삽입 (HTML 비디오 태그 활용)
      editor.chain().focus().insertContent(
        `<video src="${file.path}" controls style="max-width: 100%;"></video>`
      ).run();
    } else {
      // 일반 파일 링크 삽입
      editor.chain().focus().insertContent(
        `<a href="${file.path}" target="_blank" class="text-blue-600 underline">${file.name}</a> `
      ).run();
    }
  };

  const handleBack = () => {
    window.history.back(); // 또는 router.back()
  };

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1); // 숫자를 바꿔서 리스트의 useEffect를 깨웁니다.
  };

  const handleFileSelectFromLibrary = async (file: Attachment) => {
    if (!tempId && !existingPost?.id) {
      alert("세션이 유효하지 않습니다.");
      return;
    }

    // 1️⃣ [DB 작업] 이 파일에 현재 세션의 '이름표(tempId/documentId)'를 붙여줍니다.
    // 이 작업을 안 하면, 나중에 저장 버튼 눌러도 DB는 이 파일이 이 글 건지 모릅니다.
    const res = await linkFileToSession(file.id, tempId, existingPost?.id ?? 0);

    if (res.success) {
      // 2️⃣ [에디터 작업] 기존에 쓰시던 로직 그대로 에디터에 삽입
      handleFileClick(file);

      // 3️⃣ [UI 갱신] 상단 첨부파일 목록(PostAttachmentList)을 새로고침해서
      // 보관함에서 가져온 파일이 목록에 나타나게 합니다.
      setRefreshKey(prev => prev + 1);

      // 4️⃣ 팝업 닫기
      setShowPopup(false);
    } else {
      alert(res.message || "파일 연결에 실패했습니다.");
    }
  };

  return (
    <>
      <form ref={formRef} className="space-y-4">
        {existingPost && (
          <input type="hidden" name="id" value={existingPost.id} />
        )}
        {tempId && <input type="hidden" name="tempId" value={tempId} />}
        <div>
          {postInfo.categories && postInfo.categories.length > 0 && (
            <select
              name="categoryId"
              defaultValue={existingPost?.categoryId ?? ""}
              className="text-sm border py-2 px-4 outline-none rounded-lg border-gray-200 bg-white shadow-md shadow-gray-100 transition-all duration-200 hover:border-gray-300 focus-within:border-gray-300 focus-within:ring-4 focus-within:ring-gray-200/75 dark:border-dark-700 dark:bg-dark-900 dark:hover:border-dark-500 dark:focus-within:border-dark-300 dark:focus-within:ring-dark-300"
            >
              <option value="">카테고리 선택</option>
              {postInfo.categories.map((cat: any) => (
                <React.Fragment key={cat.id}>
                  <option value={cat.id}>{cat.title}</option>
                  {cat.children?.map((child: any) => (
                    <option key={child.id} value={child.id} className="pl-3">
                      - {child.title}
                    </option>
                  ))}
                </React.Fragment>
              ))}
            </select>
          )}
        </div>
        <input
          type="text"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력해주세요."
          className="w-full border py-2 px-4 outline-none rounded-lg border-gray-200 bg-white shadow-md shadow-gray-100 transition-all duration-200 hover:border-gray-300 focus-within:border-gray-300 focus-within:ring-4 focus-within:ring-gray-200/75 dark:border-dark-700 dark:bg-dark-900 dark:hover:border-dark-500 dark:focus-within:border-dark-300 dark:focus-within:ring-dark-300"
        />

        <ExtraFieldRenderer
          fields={postInfo?.extraFields || []}
          existingData={existingPost?.extraFieldData} // DB에 저장된 JSON 데이터
        />

        <div className="">
          <TiptapEditor
            ref={editorRef}
            initialContent={existingPost?.content || ""}
            // ✅ 에디터가 준비되었을 때 상태를 업데이트합니다.
            // (TiptapEditor 내부에서 onCreate 등의 콜백으로 처리하거나,
            // 렌더링 완료 후 ref가 잡히면 작동하도록 합니다.)
            onChange={() => {
              if (!editorReady && editorRef.current) setEditorReady(true);
            }}
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            fullWidth={false} // 💡 이제 !w-auto 없이 프롭으로 제어
            onClick={handleLoadImages}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25}
                   stroke="currentColor" className="size-4">
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            }
            className="bg-white border border-gray-300 !text-gray-600 hover:border-gray-600 hover:!text-gray-900 text-xs hover:!bg-white"
          >
            나의 첨부파일
          </Button>
        </div>

        <PostAttachmentList
          documentId={existingPost?.id}
          tempId={tempId}
          refreshKey={refreshKey}
          onFileClick={handleFileClick}
        />

        <UploadFileManager
          resourceType="posts"
          resourceId={postInfo?.id ?? 0}
          documentId={existingPost?.id ?? 0}
          tempId={tempId}
          onTempId={setTempId}
          onUploadSuccess={handleUploadSuccess}
          onFileClick={(file) => {
            // ✅ editorReady 상태가 true가 되었을 때만 실행 가능하게 하거나,
            // 직접 editorRef.current 존재를 확인합니다.
            if (!editorRef.current) {
              alert("에디터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
              return;
            }
            handleFileClick(file);
          }}
        />

        <div className="flex justify-center items-center gap-2 pt-4 pb-8">
          <Button
            type="button"
            fullWidth={false}
            onClick={handleBack}
            className="!bg-gray-100 !text-gray-600 hover:!border-gray-600 text-xs"
          >
            뒤로가기
          </Button>

          <Button
            type="button" // handleSubmit에서 form을 직접 인자로 받으므로 button 유지
            fullWidth={false}
            isLoading={loading}
            onClick={() => handleSubmit(formRef.current)}
            className="min-w-[100px] !bg-blue-100 !text-blue-600 hover:!bg-blue-600 hover:!text-white text-xs transition-all disabled:bg-gray-100"
          >
            저장하기
          </Button>
        </div>
      </form>
      <Popup state={showPopup} title="나의 첨부파일" close={closePopup}>
        <MyFiles
          onFileSelect={handleFileSelectFromLibrary}
        />
      </Popup>
    </>

  );
};

export default PostWrite;
