"use client";

import React, { useState } from "react";
import Editorjs from "@plextype/components/editor/Editorjs";

const PostWriteClient = ({
  savePost,
}: {
  savePost: (formData: FormData) => Promise<void>;
}) => {
  const [content, setContent] = useState<object>({});

  const handleContentChange = (data: object) => {
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
      <input
        type="text"
        name="title"
        placeholder="제목을 입력해주세요."
        className="w-full border rounded p-2"
      />
      <Editorjs onChange={handleContentChange} />
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
