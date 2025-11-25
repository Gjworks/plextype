import React, { Suspense } from "react";
import PostsList from "@/extentions/posts/templates/default/list";
import {getPosts} from "@/extentions/posts/scripts/actions/getPosts";
import { getSeoMetadata } from "@plextype/utils/helper/matadata";

export async function generateMetadata({ params }: { params: { pid: string } }) {
  const { pid } = params;
  const { items } = await getPosts(pid, 1, 1); // 첫 게시글만 가져와서 SEO용

  return getSeoMetadata({
    title: `${process.env.PROJECT_TITLE} - ${pid}`,
    description: items?.[0]?.title ?? `${pid} 게시판의 글 목록`,
    url: `https://example.com/posts/${pid}`,
  });
}

const Page = async ({params, searchParams}: {params: Promise<{ pid: string }>;
  searchParams?: Promise<{ page?: string }>;}) => {
  const { pid } = await params;
  const { page: pageParam } = (await searchParams) || {};
  const page = parseInt(pageParam ?? "1", 10);
  console.log(pid)
  const {items, pagination} = await getPosts(pid, page, 5);

  return (
      <div className="max-w-screen-lg mx-auto px-3">
        <Suspense fallback={<div>Loading posts...</div>}>
          {/*<PostsList params={{ pid: params.pid }} />*/}
          <PostsList
            posts={items}
            pagination={pagination}
          />
        </Suspense>
      </div>
  );
};

export default Page;
