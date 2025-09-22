
import { getDocument } from "@/extentions/posts/scripts/actions/getPosts";
import { getComments, CommentWithChildren, getParentCommentPage } from "@/extentions/posts/scripts/actions/getComments";
import { addComment } from "@/extentions/posts/scripts/actions/addComment";
import { updateComment } from "@/extentions/posts/scripts/actions/updateComment";
import PostsRead from "@/extentions/posts/templates/default/read";
import CommentsList from "@/extentions/posts/templates/default/comment/list";
import {deleteComment} from "@/extentions/posts/scripts/actions/deleteComment";

interface PageProps {
  params: { pid: string; id: string } | Promise<{ pid: string; id: string }>;
  searchParams: { [key: string]: string | string[] | undefined } | Promise<{ [key: string]: string | string[] | undefined }>;
}

const Page = async ({ params, searchParams }: PageProps) => {
  const { pid, id } = await params;
  const sp = await searchParams;

  const documentId = Number(id);
  let page = 1;
  if (typeof sp.page === "string") page = Number(sp.page);

  const document = await getDocument(documentId);
  const commentsData = await getComments(documentId, page, 10);

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
      <PostsRead document={document} />
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