// src/app/(extentions)/posts/(views)/[pid]/create/page.tsx

import React from "react";
import { Post } from "@extentions/posts"; // 🌟 우리가 만든 스마트 블록

const Page = async ({ params }: { params: Promise<{ pid: string }> }) => {
  const { pid } = await params;

  return (
    <div className="max-w-screen-lg mx-auto px-3">
      <Post.Write pid={pid} />
    </div>
  );
};

export default Page;