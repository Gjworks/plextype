import { Suspense } from "react";
import DashboardPostsList from "@extentions/posts/_admin/list";
import { getPostsList } from "@extentions/posts/_actions/posts.action";

const Page = async ({ searchParams }: { searchParams: Promise<{ page?: string }> }) => {
  const { page: pageParam } = (await searchParams) || {};
  const page = parseInt(pageParam ?? "1", 10);

  // 💡 1. 구시대의 방식 (이러면 items와 pagination이 둘 다 undefined가 됩니다!)
  // const { items, pagination } = await getPostsList(page, 10); ❌

  // 💡 2. 최신 ActionState 방식 (res 안에 success와 data가 들어있음) ✅
  const res = await getPostsList(page, 10);

  // 💡 3. 포장지(res.data)를 안전하게 뜯어서 변수에 담아줍니다.
  // 에러가 나더라도 기본값(totalCount: 0)을 줘서 화면이 뻗지 않게 막아줍니다!
  const items = res.success && res.data ? res.data.items : [];
  const pagination = res.success && res.data ? res.data.pagination : {
    totalCount: 0, totalPages: 1, page: 1, listCount: 0
  };

  return (
    <div className="p-6">
      <div className="max-w-screen-2xl mx-auto px-3 pt-6 pb-12">
        <Suspense fallback={<div>목록 로딩 중...</div>}>
          <DashboardPostsList initialData={items} pagination={pagination} />
        </Suspense>
      </div>
    </div>
  );
};

export default Page;