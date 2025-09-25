import React, { Suspense } from "react";
import PostsList from "@/extentions/posts/templates/default/list";
import {getPosts} from "@/extentions/posts/scripts/actions/getPosts";

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
