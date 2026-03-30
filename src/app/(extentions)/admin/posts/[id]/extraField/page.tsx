// src/app/(extentions)/admin/posts/[id]/extraField/page.tsx
import { findPostsById } from "@extentions/posts/_actions/posts.query";
import { savePostConfigAction } from "@extentions/posts/_actions/posts.action";
import PostFieldBuilder from "@extentions/posts/_admin/PostFieldBuilder";
import { notFound } from "next/navigation";
import { ExtraFieldConfig } from "@extentions/posts/_actions/_type";
import { ChevronRight } from "lucide-react";
import PostCategory from "@extentions/posts/_admin/components/postCategory"; // 브레드크럼용 아이콘

export default async function ExtraFieldPage({
                                               params
                                             }: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const postId = parseInt(id);

  // 1. DB에서 게시판 정보 조회
  const post = await findPostsById(postId);

  if (!post) {
    return notFound();
  }

  // 2. JSON 타입을 타입스크립트 인터페이스로 안전하게 변환
  const initialFields = (post.extraFields as unknown as ExtraFieldConfig[]) || [];

  return (
    <>
      <div className="py-6">
        <PostCategory postId={id} />
      </div>
      <div className="p-8 max-w-6xl mx-auto min-h-screen">

        {/* 1. Header & Breadcrumb: gjworks 관리자 스타일 */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">
            <span>콘텐츠 관리</span>
            <ChevronRight size={12} />
            <span>게시판 설정</span>
            <ChevronRight size={12} />
            <span className="text-blue-600 font-bold">확장 필드 빌더</span>
          </nav>

          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              {post.postName}
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
              ID: {post.pid}
            </span>
            </div>
            <p className="text-sm text-gray-500">
              해당 게시판에서 사용할 커스텀 필드를 구성합니다. 설정된 내용은 글쓰기 폼에 즉시 반영됩니다.
            </p>
          </div>
        </div>

        {/* 2. 필드 빌더 컨테이너 */}
        <div className="">
          <PostFieldBuilder
            initialFields={initialFields}
            onSave={async (fields) => {
              "use server";
              // 💡 Server Action 호출
              return await savePostConfigAction(post.pid, fields);
            }}
          />
        </div>

        {/* 3. 도움말 영역 (선택사항) */}
        <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
          <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-bold">💡 Tip:</span> 필드 키(Field Key)는 데이터베이스에 저장되는 고유 명칭입니다.
            가급적 영문 소문자와 언더바(_)만 사용하여 작성해 주세요. (예: product_version, release_date)
          </p>
        </div>
      </div>
    </>

  );
}