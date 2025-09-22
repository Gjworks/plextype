"use server";

import prisma from "@plextype/utils/db/prisma";
import {cookies} from "next/headers";
import {decodeJwt} from "jose";
export async function updateComment({
                                      commentId,
                                      content,
                                      depth, // 선택적 depth 추가
                                      isDeleted,
                                    }: {
  commentId: number;
  content: string;
  depth?: number;
  isDeleted?: boolean;
}) {
  // 로그인 체크
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) throw new Error("로그인 필요");

  const decoded = decodeJwt(accessToken) as { id: number; isAdmin: boolean } | null;
  if (!decoded) throw new Error("잘못된 토큰");

  const userId = decoded.id;

  // 댓글 존재 확인
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, userId: true },
  });
  if (!comment) throw new Error("댓글이 존재하지 않음");

  // 본인 댓글 혹은 관리자만 수정 가능
  if (comment.userId !== userId && !decoded.isAdmin) throw new Error("권한 없음");

  // 업데이트
  const updateData: any = {  };

// isDeleted가 true면 content를 강제로 변경
  if (isDeleted) {
    updateData.content = "삭제된 댓글입니다.";
  } else {
    updateData.content = content;
  }

  if (depth !== undefined) updateData.depth = depth;
  if (isDeleted !== undefined) updateData.isDeleted = isDeleted; // ← 추가

  return prisma.comment.update({
    where: { id: commentId },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          uuid: true,
          accountId: true,
          email_address: true,
          nickName: true,
        },
      },
    },
  });
}