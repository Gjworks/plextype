"use server";

import prisma from "@plextype/utils/db/prisma";
import {cookies} from "next/headers";
import {decodeJwt} from "jose";

export interface CommentType {
  id: number;
  uuid: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  documentId: number;
  userId: number | null;
  authorName: string | null;
  authorPassword: string | null;
  parentId?: number | null;
  isDeleted: boolean;
  isSecret: boolean;
  voteCount: number;
  user?: {
    id: number;
    uuid: string;
    accountId: string;
    email_address: string;
    nickName: string;
  } | null;
}

export async function addComment({
                                   documentId,
                                   content,
                                   parentId,
                                 }: {
  documentId: number;
  content: string;
  parentId?: number;
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) throw new Error("로그인 필요");

  const decoded = decodeJwt(accessToken) as { id: number; isAdmin: boolean } | null;
  if (!decoded) throw new Error("잘못된 토큰");

  const userId = decoded.id;

  let finalParentId: number | null = null;
  let depth = 0;

  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { id: true, parentId: true, depth: true },
    });

    if (!parent) throw new Error("부모 댓글 없음");

    // ✅ parent가 이미 대댓글이면 3뎁스 방지 → 최상위 댓글로 저장
    finalParentId = parent.parentId ? parent.parentId : parent.id;
    depth = parent.depth + 1; // 부모 depth + 1
  }

  return prisma.comment.create({
    data: {
      content,
      documentId,
      userId,
      parentId: finalParentId,
      depth, // 계산된 depth 저장
    },
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