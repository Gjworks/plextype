
import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { Post } from "@/modules/posts"; // 🌟 스마트 블록
import {getDocumentBySlugAction} from "@/modules/document/actions/document.action";
import { getSeoMetadata } from "@utils/helper/matadata";

interface PageProps {
  params: Promise<{ mid: string; slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ mid: string; slug: string }> }) {
  const { mid, slug } = await params;
  if (slug === "create") return getSeoMetadata({ title: "글 작성" });

  const res = await getDocumentBySlugAction(slug);
  const doc = res.data;

  return getSeoMetadata({
    title: `${process.env.PROJECT_TITLE} - ${doc?.title ?? "게시글"}`,
    description: `${doc?.user?.nickName ?? "작성자"}님의 글입니다.`,
  });
}

const Page = async ({ params, searchParams }: PageProps) => {
  const resolvedParams = await params;
  console.log("🚀 지금 들어온 파라미터:", resolvedParams);
  const { mid, slug } = await params;
  const { page } = (await searchParams) || {};
  const docId = slug;

  // 1. 작성/예외 페이지 처리
  if (slug === "create" || slug === "undefined") redirect(`/posts/${mid}/create`);

  return (
    <div className="max-w-screen-xl mx-auto">
      <Suspense fallback={<div className="py-20 text-center text-gray-400">본문을 불러오는 중...</div>}>
        <Post.Read mid={mid} slug={docId} />
      </Suspense>

      <Suspense fallback={<div className="py-10 text-center text-gray-400">댓글을 불러오는 중...</div>}>
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