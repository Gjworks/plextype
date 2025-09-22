"use client";

import React, {useState, useEffect} from "react";
import type {OutputData} from "@editorjs/editorjs";
import Editorjs from "@plextype/components/editor/Editorjs";
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


const PostWrite: React.FC<PostWriteProps> = ({savePost, existingPost}) => {
  const {postInfo} = usePostContext();
  const [title, setTitle] = useState(existingPost?.title || "");
  const [content, setContent] = useState<OutputData>(
    existingPost?.content ? JSON.parse(existingPost.content) : {}
  );

  const { permissions } = usePostContext();

  if (!permissions.doWrite) {
    return <PostNotPermission/>;
  }

  useEffect(() => {
    if (existingPost?.content) {
      try {
        const parsed: OutputData = JSON.parse(existingPost.content);
        setContent(parsed);
      } catch {
        setContent({blocks: []});
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
    await savePost(formData);

    // 이제 여기에서 저장할꺼야
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {existingPost && (
        <input type="hidden" name="id" value={existingPost.id}/>
      )}
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
      <Editorjs onChange={handleContentChange} data={content}/>
      <button
        type="submit"
        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        저장하기
      </button>
    </form>
  );
};

export default PostWrite;
