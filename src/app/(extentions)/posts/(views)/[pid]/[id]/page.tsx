import { cookies, headers } from "next/headers";
import { decodeJwt } from "jose";
import { redirect } from "next/navigation";
import { getDocument, increaseViewCount } from "@extentions/posts/_actions/document.action";
import PostsRead from "@extentions/posts/_tpl/default/read";
import CommentsList from "@extentions/posts/_tpl/default/comment/list";
import { getSeoMetadata } from "@/utils/helper/matadata";

// 타입 및 새로운 액션 임포트
import { CommentWithChildren, CurrentUser } from "@extentions/posts/_actions/_type";
import {
  getCommentsAction,
  getParticipantsAction,
  saveCommentAction,
  removeCommentAction
} from "@extentions/posts/_actions/comment.action";

interface PageProps {
  params: Promise<{ pid: string; id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

// 📌 1. 메타데이터 생성 (안전하게 수정)
export async function generateMetadata({ params }: { params: Promise<{ pid: string; id: string }> }) {
  const { pid, id } = await params;
  if (id === "create") {
    return getSeoMetadata({
      title: `${pid} 게시판 글 작성`,
      description: `${pid} 게시판에 새 글을 작성합니다.`,
      url: `https://example.com/posts/${pid}/create`,
    });
  }

  const res = await getDocument(Number(id));
  const document = res.data;

  return getSeoMetadata({
    title: `${process.env.PROJECT_TITLE} - ${document?.title ?? "게시글"}`,
    description: `${document?.user?.nickName ?? "작성자"}님의 글입니다.`,
    url: `https://example.com/posts/${pid}/${id}`,
  });
}

const Page = async ({ params, searchParams }: PageProps) => {
  const { pid, id } = await params;
  if (id === "create" || id === "undefined") redirect(`/posts/${pid}/create`);

  const sp = (await searchParams) ?? {};
  const documentId = Number(id);
  const page = typeof sp.page === "string" ? Number(sp.page) : 1;

  // 📌 2. 데이터 페칭 (ActionState 포장지 고려)
  const [docRes, commentsData, participantsRes] = await Promise.all([
    getDocument(documentId),
    getCommentsAction(documentId, page, 10),
    getParticipantsAction(documentId)
  ]);

  if (!docRes.success || !docRes.data) redirect(`/posts/${pid}`);
  const document = docRes.data;
  const participants = participantsRes.data ?? []; // ActionState에서 data만 추출

  /// 📌 3. 유저 정보 세팅
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

// 🌟 타입을 명시적으로 지정 (CurrentUser | null)
// 이렇게 해야 나중에 객체가 할당되어도 TS가 id를 찾아낼 수 있습니다.
  let currentUser: CurrentUser | null = null;

  if (accessToken) {
    try {
      const decoded = decodeJwt(accessToken) as any;
      if (decoded) {
        // 이제 할당이 가능해집니다.
        currentUser = { ...decoded, loggedIn: true };
      }
    } catch (err) {
      console.log("JWT decode 실패", err);
    }
  }

// 📌 4. 조회수 증가
  const requestIp = (await headers()).get("x-forwarded-for") || '';

// 이제 currentUser?.id 에서 'never' 에러가 사라집니다!
  await increaseViewCount(documentId, currentUser?.id, requestIp);

  /**
   * 📌 5. 핵심: upsertComment 리팩토링
   * 이제 save/remove 액션이 카운트와 소프트 삭제를 모두 담당합니다.
   */
  async function upsertComment({
                                 documentId,
                                 content,
                                 parentId,
                                 commentId,
                                 options,
                               }: {
    documentId: number;
    content: string;
    parentId?: number;
    commentId?: number;
    options?: { deleted?: boolean; remove?: boolean }
  }) {
    "use server";
    const path = `/posts/${pid}/${id}`;

    // A. 삭제 요청 (실제 삭제/소프트 삭제는 액션 내부에서 판단)
    if (commentId && (options?.remove || options?.deleted)) {
      const res = await removeCommentAction(documentId, commentId, path);
      return { success: res.success, actionType: 'DELETE' };
    }

    // B. 저장 요청 (등록/수정 통합)
    const formData = new FormData();
    if (commentId) formData.append("id", commentId.toString());
    formData.append("documentId", documentId.toString());
    formData.append("content", content);
    if (parentId) formData.append("parentId", parentId.toString());

    const res = await saveCommentAction(formData, path);

    return {
      success: res.success,
      item: res.data as CommentWithChildren,
      actionType: commentId ? 'UPDATE' : 'CREATE'
    };
  }

  // 페이지네이션 호출용
  const getCommentsPage = async (page: number) => {
    "use server";
    return await getCommentsAction(documentId, page, 10);
  };

  return (
    <>
      <PostsRead document={document} participants={participants} />
      <CommentsList
        documentId={documentId}
        // 🌟 commentsData.data를 넘기고, 없을 경우를 대비해 빈 배열/페이지네이션 정보를 넘깁니다.
        commentsData={commentsData.data || {
          items: [],
          pagination: { totalCount: 0, totalPages: 0, currentPage: 1, pageSize: 10 }
        }}
        upsertComment={upsertComment}
        getCommentsPage={getCommentsPage}
      />
    </>
  );
};

export default Page;