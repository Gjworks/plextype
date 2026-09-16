
import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { Post } from "@/modules/posts"; // 🌟 스마트 블록
import { getPostReadMetadata } from "@/modules/posts/actions/seo.action";
import ReadLoading, { CommentsLoading } from "@/modules/posts/tpl/default/readLoading";

interface PageProps {
  params: Promise<{ mid: string; slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: any) {
  const { slug, mid } = await params;
  return await getPostReadMetadata(slug, mid); // 👈 한 줄 컷!
}

const Page = async ({ params, searchParams }: PageProps) => {
  const { mid, slug } = await params;
  const { page } = (await searchParams) || {};
  const docId = slug;

  // 1. 작성/예외 페이지 처리
  if (slug === "create" || slug === "undefined") redirect(`/posts/${mid}/create`);

  return (
    <div className="w-full max-w-screen-xl mx-auto">
      <div className="min-h-[70svh] w-full">
        <Suspense key={`${mid}/${docId}`} fallback={<ReadLoading />}>
          <Post.Read mid={mid} slug={docId} />
        </Suspense>
      </div>

      <Suspense key={`${mid}/${docId}/comments/${page || 1}`} fallback={<CommentsLoading />}>
        <Post.Comments
          mid={mid}
          slug={docId}
          page={Number(page || 1)}
        />
      </Suspense>
    </div>
  );
};

export default Page;
