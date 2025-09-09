"use client";

import React, { useState, useEffect } from "react";
import type { OutputData } from "@editorjs/editorjs";
import Editorjs from "@plextype/components/editor/Editorjs";

interface PostWriteClientProps {
    savePost: (formData: FormData) => Promise<void>;
    existingPost?: {
        id: number;
        title: string | null;
        content: string | null; // DB에 JSON string이라면 string | null
    } | null;
}


const PostWriteClient: React.FC<PostWriteClientProps> = ({ savePost, existingPost }) => {
    const [title, setTitle] = useState(existingPost?.title || "");
    const [content, setContent] = useState<OutputData>(
        existingPost?.content ? JSON.parse(existingPost.content) : {}
    );

    useEffect(() => {
        if (existingPost?.content) {
            try {
                const parsed:OutputData = JSON.parse(existingPost.content);
                setContent(parsed);
            } catch {
                setContent({ blocks: [] });
            }
        }
    }, [existingPost]);

  const handleContentChange = (data: OutputData) => {
    setContent(data);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    // JSON 객체를 문자열로 변환
    formData.append("content", JSON.stringify(content));
    console.log(formData);
      await savePost(formData);

    // 이제 여기에서 저장할꺼야
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        {existingPost && (
            <input type="hidden" name="id" value={existingPost.id} />
        )}
      <input
        type="text"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목을 입력해주세요."
        className="w-full border rounded p-2"
      />
      <Editorjs onChange={handleContentChange} data={content} />
      <button
        type="submit"
        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        저장하기
      </button>
    </form>
  );
};

export default PostWriteClient;
