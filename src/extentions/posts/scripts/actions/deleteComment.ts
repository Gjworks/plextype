"use server";

import prisma from "@plextype/utils/db/prisma";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";

/**
 * 댓글 소프트 삭제
 * - 자식 댓글이 있으면 content는 그대로 두고 isDeleted=true
 * - 자식 댓글이 없으면 실제 삭제(원하면 실제 삭제 대신 isDeleted만 설정)
 */
export async function deleteComment(commentId: number) {
  // 로그인 체크
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) throw new Error("로그인 필요");

  const decoded = decodeJwt(accessToken) as { id: number; isAdmin: boolean } | null;
  if (!decoded) throw new Error("잘못된 토큰");

  const userId = decoded.id;

  // 댓글 존재 확인 (자식 댓글 포함)
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { children: true },
  });
  if (!comment) throw new Error("댓글이 존재하지 않음");

  // 본인 댓글 혹은 관리자만 삭제 가능
  if (comment.userId !== userId && !decoded.isAdmin) throw new Error("권한 없음");

  if (comment.children.length > 0) {
    // 자식 댓글이 있으면 내용 숨김 + 소프트 삭제 표시
    return prisma.comment.update({
      where: { id: commentId },
      data: { content: "해당 댓글은 삭제되었습니다.", isDeleted: true },
    });
  } else {
    // 자식 댓글이 없으면 실제 삭제
    return prisma.comment.delete({
      where: { id: commentId },
    });
  }
}