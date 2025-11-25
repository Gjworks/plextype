import {cookies} from "next/headers";
import {decodeJwt} from "jose";
import { headers } from "next/headers";
import { getDocument } from "@/extentions/posts/scripts/actions/getPosts";
import { getComments, CommentWithChildren, getParentCommentPage } from "@/extentions/posts/scripts/actions/getComments";
import { addComment } from "@/extentions/posts/scripts/actions/addComment";
import { updateComment } from "@/extentions/posts/scripts/actions/updateComment";
import PostsRead from "@/extentions/posts/templates/default/read";
import CommentsList from "@/extentions/posts/templates/default/comment/list";
import {deleteComment} from "@/extentions/posts/scripts/actions/deleteComment";
import {increaseViewCount} from "@/extentions/posts/scripts/actions/increaseViewCount"
import {addCommentAndIncrementCount, deleteCommentAndDecrementCount} from "@/extentions/posts/scripts/actions/commentCountAction"
import {getUniqueCommentMember} from "@/extentions/posts/scripts/actions/getUniqueCommentMember";
import {redirect} from "next/navigation";
import { getSeoMetadata } from "@plextype/utils/helper/matadata";

interface PageProps {
  params: Promise<{
    pid: string;
    id: string;
  }>;
  searchParams?: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}

interface CurrentUser {
  id: number;
  accountId: string;
  isAdmin: boolean;
  groups: number[]; // 사용자가 속한 그룹 ID 배열
  loggedIn: boolean; // 로그인 상태
}

export async function generateMetadata({ params }: { params: { pid: string; id: string } }) {
  const { pid, id } = await params;

  // id가 "create"일 경우 SEO는 기본값
  if (id === "create") {
    return getSeoMetadata({
      title: `${pid} 게시판 글 작성`,
      description: `${pid} 게시판에 새 글을 작성합니다.`,
      url: `https://example.com/posts/${pid}/create`,
    });
  }

  const documentId = Number(id);

  // 문서 상세 조회 (이미 Page에서 사용하는 getDocument 재사용)

  const document = (await getDocument(documentId)) as {
    id: number;
    title: string | null;
    content: string | null;
    createdAt: Date;
    updatedAt: Date;
    user?: { id: number; nickName: string };
  };

  return getSeoMetadata({
    title: `${process.env.PROJECT_TITLE} - ${document?.title}`,
    description: `${process.env.PROJECT_TITLE} - ${document?.title}`,
    url: `https://example.com/posts/${pid}/${id}`,
  });
}

const Page = async ({ params, searchParams }: PageProps) => {
  const { pid, id } =  await params;

  if (id === "create" || id === "undefined") {
    redirect(`/posts/${pid}/create`);
  }

  const sp = (await searchParams) ?? {};

  const documentId = Number(id);
  let page = 1;
  if (typeof sp.page === "string") page = Number(sp.page);

  const document = await getDocument(documentId);

  let currentUser: CurrentUser | null = null;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (accessToken) {
    try {
      // JWT에서 우리가 넣은 custom claims로 단언
      const decoded = decodeJwt(accessToken) as {
        id: number;
        accountId: string;
        isAdmin: boolean;
        groups: number[];
      } | null;

      if (decoded) {
        currentUser = {...decoded, loggedIn: true};
      }
    } catch (err) {
      console.log("JWT decode 실패", err);
    }
  }
  const requestIp = (await headers()).get("x-forwarded-for") || '';
  await increaseViewCount(documentId, currentUser?.id, requestIp);
  const commentsData = await getComments(documentId, page, 10);

  const participants = (await getUniqueCommentMember(documentId)).filter(
    (p): p is { id: number; nickName: string; profile_image?: string } => p !== null
  );

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
    }): Promise<{
    items: CommentWithChildren[];
    pagination: { totalPages: number; totalCount: number; currentPage: number; pageSize: number };
    targetPage: number;
    newCommentId?: number;
  }> {
    "use server";

    let newCommentId: number | undefined = undefined;

    if (commentId) {
      if (options?.remove) {
        // 실제 삭제
        await deleteCommentAndDecrementCount(documentId); // <- 여기
        await deleteComment( commentId ); // 혹은 deleteComment API 필요
      } else if (options?.deleted) {
        // 소프트 삭제
        await updateComment({ commentId, content, isDeleted: true });
      } else {
        // 일반 수정
        await updateComment({ commentId, content });
      }
      newCommentId = commentId;
    } else {
      const created = await addComment({ documentId, content, parentId });
      await addCommentAndIncrementCount( documentId ); // <- 여기
      newCommentId = created.id;
    }

    let targetPage = 1;

    if (!parentId) {
      // 루트 댓글 → 마지막 페이지
      const updated = await getComments(documentId, 1, 10);
      targetPage = updated.pagination.totalPages;
    } else {
      // 대댓글 → 부모 댓글 기준 페이지 계산
      const parentIndex = await getParentCommentPage(documentId, parentId);
      targetPage = Math.floor(parentIndex / 10) + 1;
    }

    const updatedComments = await getComments(documentId, targetPage, 10);

    return {
      items: updatedComments.items,
      pagination: updatedComments.pagination,
      targetPage,
      newCommentId,
    };
  }

  const getCommentsPage = async (page: number) => {
    "use server";
    return await getComments(documentId, page, 10);
  };

  return (
    <>
      <PostsRead document={document} participants={participants}  />
      <CommentsList
        documentId={documentId}
        commentsData={commentsData}
        upsertComment={upsertComment} // Server Action prop 전달
        getCommentsPage={getCommentsPage} // 페이지 변경
      />
    </>
  );
};

export default Page;