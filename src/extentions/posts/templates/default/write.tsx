"use client";

import React, {useState, useRef} from "react";
import type {OutputData} from "@editorjs/editorjs";
import Editorjs from "@plextype/components/editor/Editorjs";
import UploadFileManager from "@plextype/components/editor/UploadFileManager";
import {usePostContext} from "./PostProvider";
import PostNotPermission from "@/extentions/posts/templates/default/notPermission";
import Popup from "@plextype/components/modal/Popup";
import MyFiles from "./myFiles"

interface PostWriteProps {
  savePost: (formData: FormData) => Promise<void>;
  existingPost?: {
    id: number;
    categoryId: number | null;
    title: string | null;
    content: string | null; // DB에 JSON string이라면 string | null
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

const PostWrite: React.FC<PostWriteProps> = ({savePost, existingPost}) => {
  const {postInfo} = usePostContext();

  const formRef = useRef<HTMLFormElement | null>(null); // ✅ formRef 생성
  const [title, setTitle] = useState(existingPost?.title || "");
  const [tempId, setTempId] = useState<string | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const editorRef = useRef<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const closePopup = (close) => {
    setShowPopup(close);
  };
  const [content, setContent] = useState<OutputData>(
    existingPost?.content
      ? (() => {
        try {
          return JSON.parse(existingPost.content);
        } catch {
          return { blocks: [] };
        }
      })()
      : { blocks: [] } // ← 기본값을 항상 blocks 배열로
  );

  const { permissions } = usePostContext();

  if (!permissions.doWrite) {
    return <PostNotPermission/>;
  }

  const handleContentChange = (data: OutputData) => {
    setContent(data);
  };

  const handleLoadImages = () => {
    setShowPopup(true);
  }

  const handleSubmit = async (form?: HTMLFormElement | null) => {
    if (!form || loading) return; // 로딩 중 중복 클릭 방지

    setLoading(true); // 로딩 시작
    try {
      const formData = new FormData(form);
      formData.append("content", JSON.stringify(content));
      await savePost(formData);
    } catch (error) {
      console.error("저장 중 오류 발생:", error);
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  const handleFileClick = async (file: Attachment) => {
    let editor = editorRef.current;

    // 1️⃣ 아직 ref가 연결 안됐을 수 있음 → 기다림
    if (!editor) {
      console.warn("EditorJS ref not ready yet, waiting...");
      await new Promise((resolve) => setTimeout(resolve, 100));
      editor = editorRef.current;
    }

    if (!editor) {
      console.error("EditorJS instance not found even after delay");
      return;
    }

    // 2️⃣ 내부 준비 완료 보장
    await editor.isReady;

    // 3️⃣ 삽입
    if (file.mimeType.startsWith("image/")) {
      await editor.blocks.insert("image", {
        file: { url: file.path },
      });
    } else if (file.mimeType.startsWith("video/")) {
      await editor.blocks.insert("embed", {
        service: "video",
        source: file.path,
        embed: file.path,
        width: 640,
        height: 360,
      });
    } else {
      await editor.blocks.insert("paragraph", {
        text: `<a href="${file.path}" target="_blank">${file.name}</a>`,
      });
    }
  };
  const handleBack = () => {
    window.history.back(); // 또는 router.back()
  };
  return (
    <>
      <form ref={formRef} className="space-y-4">
        {existingPost && (
          <input type="hidden" name="id" value={existingPost.id}/>
        )}
        {tempId && <input type="hidden" name="tempId" value={tempId}/>}
        <div>
          {postInfo.categories && postInfo.categories.length > 0 && (
            <select
              name="categoryId"
              defaultValue={existingPost?.categoryId ?? ""}
              className="text-sm p-2 outline-none bg-gray-100  border border-dashed rounded-xl"
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
          className="w-full py-2 px-4 outline-none text-xl leading-10 border border-dashed rounded-xl"
        />
       <div className="border border-dashed rounded-xl py-3 px-8">
         <Editorjs
           ref={editorRef}
           onReady={(editorInstance) => {
             console.log("Editor Ready:", editorInstance);
             editorRef.current = editorInstance; // ✅ 직접 ref 세팅
             setEditorReady(true);
           }}
           onChange={handleContentChange}
           data={existingPost?.content ? JSON.parse(existingPost.content) : undefined}
         />
       </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleLoadImages}
            className="flex gap-1 items-center px-6 py-2 border border-gray-300 text-gray-600 rounded-md hover:border-gray-600 hover:text-gray-900 text-xs"
          >
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25}
                 stroke="currentColor" className="size-4">
  <path strokeLinecap="round" strokeLinejoin="round"
        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/>
</svg>

          </span>
            <span>
            나의 첨부파일
         </span>
          </button>
        </div>

        <UploadFileManager
          resourceType="posts"
          resourceId={postInfo?.id ?? 0}
          documentId={existingPost?.id ?? 0}
          tempId={tempId}
          onTempId={setTempId}
          onFileClick={(file) => {
            if (!editorReady) return; // 아직 준비 안 됐으면 무시
            handleFileClick(file);
          }}
        />

        <div className="flex justify-center items-center gap-2 pt-4 pb-8">
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-2 border border-gray-300 text-gray-600 rounded-md hover:border-gray-600 text-xs"
          >
            뒤로가기
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(formRef.current)}
            className="min-w-[100px] flex justify-center items-center px-6 py-2 bg-blue-100 border border-blue-100 text-blue-600 rounded-md hover:bg-blue-600 hover:border-blue-600 hover:text-white text-xs transition-all disabled:bg-gray-100 disabled:border-gray-100 disabled:text-gray-400"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></span>
            ) : (
              "저장하기"
            )}
          </button>
        </div>
      </form>
      <Popup state={showPopup} title="나의 첨부파일" close={closePopup}>
        <MyFiles
          onFileSelect={(file) => {
            handleFileClick(file);
            setShowPopup(false); // 선택 후 팝업 닫기
          }}
        />
      </Popup>
    </>

  );
};

export default PostWrite;
