// src/app/(extentions)/posts/[pid]/edit/[id]/page.tsx (또는 해당 경로)

import PostWrite from "@extentions/posts/_tpl/default/write";
import { getDocument, saveDocument } from "@extentions/posts/_actions/document.action";
import { DocumentInfo } from "@extentions/posts/_actions/_type";
import PostNotFound from "@extentions/posts/_tpl/default/notFound";

const Page = async ({ params }: { params: Promise<{ pid: string; id: string }> }) => {
  const { pid, id } = await params;

  let existingPost: DocumentInfo | null = null;

  // 1. 수정 모드일 때 (id가 숫자로 들어올 때) 기존 글 가져오기
  if (id && id !== "create") {
    const res = await getDocument(Number(id));

    if (!res.success || !res.data) {
      return <PostNotFound />;
    }

    existingPost = res.data;
  }

  // 2. 서버 액션 연결
  const savePost = async (formData: FormData) => {
    "use server";
    // 🌟 리턴을 꼭 해줘야 클라이언트(PostWrite)에서 res.success를 읽을 수 있습니다!
    return await saveDocument(pid, formData, `/posts/${pid}`);
  };

  return (
    <div className="max-w-screen-lg mx-auto px-3">
      <div className="py-5 rounded-2xl">
        <div className="pt-8 mb-6">
          {/* existingPost가 있으면 수정, 없으면 신규 작성으로 PostWrite가 동작합니다. */}
          <PostWrite savePost={savePost} existingPost={existingPost} />
        </div>
      </div>
    </div>
  );
};

export default Page;