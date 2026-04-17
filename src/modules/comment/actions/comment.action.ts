// src/app/(extentions)/posts/_actions/comment.action.ts
"use server";

import { revalidatePath } from "next/cache";
import * as query from "./comment.query";
import { ActionState, CommentWithChildren, CommentListResponse } from "./_type";
import { withTrigger } from "@utils/trigger/triggerWrapper";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";


async function getLoggedInfo() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) return null;
  return decodeJwt(accessToken) as { id: number; isAdmin: boolean };
}

// [GET] 댓글 목록 조회
export async function getCommentsAction(documentId: number, page: number = 1, pageSize: number = 10): Promise<ActionState<CommentListResponse>> {
  try {
    const totalCount = await query.countRootComments(documentId);
    const rootComments = await query.findRootComments(documentId, page, pageSize);
    const rootIds = rootComments.map(rc => rc.id);
    const childComments = await query.findChildComments(documentId, rootIds);

    const items: CommentWithChildren[] = rootComments.map(rc => ({
      ...rc,
      userName: rc.user?.nickName ?? null,
      createdAt: rc.createdAt.toISOString(),
      updatedAt: rc.updatedAt.toISOString(),
      children: childComments
        .filter(cc => cc.parentId === rc.id)
        .map(cc => ({
          ...cc,
          userName: cc.user?.nickName ?? null,
          createdAt: cc.createdAt.toISOString(),
          updatedAt: cc.updatedAt.toISOString(),
          children: []
        }))
    })) as any;

    return {
      success: true, message: "조회 성공",
      data: { items, pagination: { totalCount, totalPages: Math.ceil(totalCount / pageSize), currentPage: page, pageSize } }
    };
  } catch (error) {
    return { success: false, message: "조회 실패" };
  }
}

// [SAVE] 원본의 addComment + addCommentAndIncrementCount 통합
export const saveCommentAction = withTrigger("comment.saved", async (formData: FormData, paths?: string): Promise<ActionState<CommentWithChildren>> => {
  console.log("🚀 saveCommentAction 시작됨!");
  try {
    const loggedInfo = await getLoggedInfo();
    if (!loggedInfo) return { success: false, message: "로그인 필요" };

    const id = formData.get("id") ? Number(formData.get("id")) : null;
    const documentId = Number(formData.get("documentId"));
    const content = formData.get("content") as string;
    const parentId = formData.get("parentId") ? Number(formData.get("parentId")) : null;

    let result;
    if (id) {
      // 수정 (원본 updateComment 로직)
      result = await query.updateComment(id, { content });
    } else {
      // 등록 (원본 addComment 로직)
      let depth = 0;
      let finalParentId = parentId;
      if (parentId) {
        const parent = await query.findCommentById(parentId);
        finalParentId = parent?.parentId ?? parent?.id ?? null;
        depth = (parent?.depth ?? 0) + 1;
      }
      result = await query.insertComment({ content, documentId, userId: loggedInfo.id, parentId: finalParentId, depth });

      console.log("🔥 DB 저장 직후 결과:", JSON.stringify(result, null, 2));
      // ✅ 여기서 원본의 addCommentAndIncrementCount 로직 실행
      await query.incrementDocumentCommentCount(documentId);
    }

    if (paths) revalidatePath(paths);
    return { success: true, message: "저장 완료", data: { ...result, userName: result.user?.nickName, createdAt: result.createdAt.toISOString(), updatedAt: result.updatedAt.toISOString(), children: [] } as any };
  } catch (error) {
    return { success: false, message: "저장 실패" };
  }
});

// [REMOVE] 원본의 deleteComment + deleteCommentAndDecrementCount 통합
export async function removeCommentAction(documentId: number, commentId: number, paths?: string): Promise<ActionState<null>> {
  try {
    const comment = await query.findCommentById(commentId);
    if (!comment) return { success: false, message: "댓글 없음" };

    const childCount = comment._count?.children ?? 0;
    if (childCount > 0) {
      // 소프트 삭제 (자식이 있는 경우)
      await query.updateComment(commentId, { content: "해당 댓글은 삭제되었습니다.", isDeleted: true });
    } else {
      // 실제 삭제 (자식이 없는 경우)
      await query.deleteComment(commentId);
    }

    // ✅ 여기서 원본의 deleteCommentAndDecrementCount 로직 실행
    await query.decrementDocumentCommentCount(documentId);

    if (paths) revalidatePath(paths);
    return { success: true, message: "삭제 완료" };
  } catch (error) {
    return { success: false, message: "삭제 실패" };
  }
}

// 참여자 조회 액션
export async function getParticipantsAction(documentId: number): Promise<ActionState<any[]>> {
  try {
    const members = await query.findParticipants(documentId);
    return { success: true, message: "조회 성공", data: members.map(m => m.user).filter(Boolean) };
  } catch (error) {
    return { success: false, message: "조회 실패" };
  }
}