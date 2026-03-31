// src/app/(extentions)/posts/(views)/[pid]/[id]/edit/page.tsx

import React from "react";
import { Post } from "@extentions/posts";

const Page = async ({ params }: { params: Promise<{ pid: string; id: string }> }) => {
  const { pid, id } = await params;

  return (
    <div className="max-w-screen-lg mx-auto px-3">
      {/* 🌟 [딱 한 줄 조립]
          기존 글 가져오기, 권한 체크, 저장 액션 연결까지 Post.Write가 다 합니다.
      */}
      <Post.Write pid={pid} id={Number(id)} />
    </div>
  );
};

export default Page;