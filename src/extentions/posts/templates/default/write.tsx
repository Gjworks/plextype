"use client";

import React, {useState, useEffect, useRef} from "react";
import type {OutputData} from "@editorjs/editorjs";
import Editorjs from "@plextype/components/editor/Editorjs";
import UploadFileManager from "@plextype/components/editor/UploadFileManager";
import {usePostContext} from "./PostProvider";
import PostNotPermission from "@/extentions/posts/templates/default/notPermission";

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

  const handleSubmit = async (form?: HTMLFormElement | null) => {
    if (!form) return;

    const formData = new FormData(form);
    formData.append("content", JSON.stringify(content));
    await savePost(formData);
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
  return (
    <form ref={formRef}  className="space-y-4">
      {existingPost && (
        <input type="hidden" name="id" value={existingPost.id}/>
      )}
      {tempId && <input type="hidden" name="tempId" value={tempId} />}
      <div>
        {postInfo.categories && postInfo.categories.length > 0 && (
          <select
            name="categoryId"
            defaultValue={existingPost?.categoryId ?? ""}
            className="text-sm p-2 outline-none bg-gray-100 rounded-md"
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
        className="w-full p-2 outline-none text-3xl leading-10"
      />
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

      <button
        type="button"
        onClick={() => handleSubmit(formRef.current)} // 직접 호출
        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        저장하기
      </button>
    </form>
  );
};

export default PostWrite;
