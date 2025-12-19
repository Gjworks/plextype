import { Suspense } from "react";
import DashboardPostsList from "@/extentions/posts/admin/templates/list";
import { getPosts } from "@/extentions/posts/admin/scripts/actions/posts";

const Page = async ({ searchParams }: { searchParams: Promise<{ page?: string }> }) => {
  const { page: pageParam } = (await searchParams) || {};
  const page = parseInt(pageParam ?? "1", 10);

  // 서버 액션을 직접 호출하여 데이터를 가져옵니다.
  const { items, pagination } = await getPosts( page, 10);
  console.log(items)

  return (
    <div className="p-6">
      <div className="max-w-screen-2xl mx-auto px-3 pt-6 pb-12">
      <Suspense fallback={<div>목록 로딩 중...</div>}>
        {/* 클라이언트 컴포넌트에 데이터를 넘겨줍니다. */}
        <DashboardPostsList initialData={items} pagination={pagination} />
      </Suspense>
      </div>
    </div>
  );
};

export default Page;
