import React, { Suspense } from "react";
import PostsList from "@/extentions/posts/templates/default/list";
import { getPosts } from "@/extentions/posts/scripts/actions/getPosts";
import { getSeoMetadata } from "@plextype/utils/helper/matadata";

export async function generateMetadata({ params }: {params: Promise<{ pid: string }> }) {
  const { pid } = await params;
  // 메타데이터 생성 시에도 필요하다면 category를 반영할 수 있습니다. (선택사항)
  const { items } = await getPosts(pid, 1, 1);

  return getSeoMetadata({
    title: `${process.env.PROJECT_TITLE} - ${pid}`,
    description: items?.[0]?.title ?? `${pid} 게시판의 글 목록`,
    url: `https://example.com/posts/${pid}`,
  });
}

const Page = async ({params, searchParams}: {
  params: Promise<{ pid: string }>;
  searchParams?: Promise<{ page?: string; category?: string }>; // 1. category 타입 추가
}) => {
  const { pid } = await params;

  // 2. searchParams에서 category 값 추출
  const { page: pageParam, category } = (await searchParams) || {};

  const page = parseInt(pageParam ?? "1", 10);
  const currentCategory = category ?? "all"; // 키 생성을 위한 기본값
  // 3. getPosts 함수에 category 인자 전달
  // (category가 undefined일 경우 백엔드에서 '전체'로 처리하도록 구현되어 있어야 함)
  const {items, pagination} = await getPosts(pid, page, 5, category);

  return (
    <div className="max-w-screen-lg mx-auto px-3">
      <Suspense fallback={<div>Loading posts...</div>}>
        <PostsList
          key={`${currentCategory}-${page}`}
          posts={items}
          pagination={pagination}
        />
      </Suspense>
    </div>
  );
};

export default Page;