// src/app/(extentions)/admin/posts/[id]/update/page.tsx
import DashboardPostCreate from "@modules/posts/_admin/create";
import PostCategory from "@modules/posts/_admin/components/postCategory";
import { getPostsInfoById } from "@modules/posts/_actions/posts.action";
import { getGroups } from "@modules/user/_actions/group.action";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  // 💡 유저 페이지와 똑같이 서버에서 미리 데이터를 병렬로 땡겨옵니다!
  const [postRes, groupList] = await Promise.all([
    getPostsInfoById(Number(id)),
    getGroups()
  ]);

  if (!postRes.success) return <div>게시판을 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-screen-2xl mx-auto px-3 py-6">
      {/* 1. 카테고리 관리 영역 */}
      <div className="mb-10">
        <PostCategory postId={id} />
      </div>

      {/* 2. 게시판 설정 폼 (유저 UpsertForm처럼 데이터를 프롭으로 전달) */}
      <DashboardPostCreate
        initialData={postRes.data}
        groupList={groupList}
        mid={id}
      />
    </div>
  );
};

export default Page;