import React, { Suspense } from "react";
import { Post } from "@modules/posts"; // 🌟 우리가 만든 스마트 블록 가져오기
import { getDocumentList } from "@modules/document/_actions/document.action";
import { getSeoMetadata } from "@/core/utils/helper/matadata";

// 📌 1. 메타데이터 생성 (여기는 데이터를 읽어야 하니 기존 로직 유지)
export async function generateMetadata({ params }: { params: Promise<{ mid: string }> }) {
  const { mid } = await params;
  const res = await getDocumentList(mid, 1, 1);
  const items = res.success && res.data ? res.data.documentList : [];

  return getSeoMetadata({
    title: `${process.env.PROJECT_TITLE || '게시판'} - ${mid}`,
    description: items?.[0]?.title ?? `${mid} 게시판의 글 목록`,
    url: `https://example.com/posts/${mid}`,
  });
}

// 📌 2. 페이지 컴포넌트 (세상에서 제일 깔끔!)
const Page = async ({ params, searchParams }: {
  params: Promise<{ mid: string }>;
  searchParams?: Promise<{ page?: string; category?: string }>;
}) => {
  const { mid } = await params;
  const { page, category } = (await searchParams) || {};

  return (
    <div className="max-w-screen-lg mx-auto px-3">
      {/* 🌟 [핵심] 이제 복잡한 로직은 Post.List 블록이 다 알아서 합니다.
         우리는 그냥 레고 블록 끼우듯이 한 줄만 딱!
      */}
      <Suspense fallback={<div className="py-20 text-center text-gray-400">게시글을 불러오는 중입니다...</div>}>
        <Post.List
          mid={mid}
          page={Number(page || 1)}
          limit={10}
          category={category}
        />
      </Suspense>
    </div>
  );
};

export default Page;