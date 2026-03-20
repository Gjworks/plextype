import React, { Suspense } from "react";
import PostsList from "@extentions/posts/_tpl/default/list";
import { getDocumentList } from "@extentions/posts/_actions/document.action";
import { getSeoMetadata } from "@/utils/helper/matadata";

export async function generateMetadata({ params }: {params: Promise<{ pid: string }> }) {
  const { pid } = await params;

  // 💡 2. 메타데이터용 첫 번째 글 가져오기 (Action 포장지 뜯기!)
  const res = await getDocumentList(pid, 1, 1);
  const items = res.success && res.data ? res.data.documentList : [];

  return getSeoMetadata({
    title: `${process.env.PROJECT_TITLE || '게시판'} - ${pid}`,
    description: items?.[0]?.title ?? `${pid} 게시판의 글 목록`,
    url: `https://example.com/posts/${pid}`,
  });
}

const Page = async ({params, searchParams}: {
  params: Promise<{ pid: string }>;
  searchParams?: Promise<{ page?: string; category?: string }>;
}) => {
  const { pid } = await params;
  const { page: pageParam, category } = (await searchParams) || {};

  const page = parseInt(pageParam ?? "1", 10);
  const currentCategory = category ?? "all";

  // 💡 3. 새 매니저에게 pid, page, limit(5), category를 전달하여 요청합니다!
  const res = await getDocumentList(pid, page, 5, category);

  // 💡 4. ActionState 포장지를 뜯어서 알맹이를 안전하게 꺼냅니다!
  // (PostsList 컴포넌트가 예전 이름인 posts, pagination을 기대하므로 맞춰서 맵핑해줍니다)
  const items = res.success && res.data ? res.data.documentList : [];
  const pagination = res.success && res.data ? res.data.navigation : {
    totalCount: 0, totalPages: 1, page: 1, listCount: 0
  };

  return (
    <div className="max-w-screen-lg mx-auto px-3">
      <Suspense fallback={<div>Loading posts...</div>}>
        <PostsList
          key={`${currentCategory}-${page}`}
          posts={items} // 💡 추출한 items(documentList)를 넘겨줌
          pagination={pagination} // 💡 추출한 pagination(navigation)을 넘겨줌
        />
      </Suspense>
    </div>
  );
};

export default Page;