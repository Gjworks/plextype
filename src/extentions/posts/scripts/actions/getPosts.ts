// src/extentions/posts/admin/scripts/data/post.ts

import prisma from "@plextype/utils/db/prisma";

export async function getPosts(pid: string) {
  // 1. 게시판 찾기
  const posts = await prisma.posts.findUnique({
    where: { pid },
    select: { id: true },
  });

  if (!posts) {
    return [];
  }

  // 2. 게시판에 속한 Document (= 게시글) 가져오기
  const document = await prisma.document.findMany({
    where: {
      resourceType: "post",
      resourceId: posts.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      isNotice: true,
      isSecrets: true,
      readCount: true,
      commentCount: true,
      voteCount: true,
      user: {
        select: {
          id: true,
          nickName: true,
        },
      },
    },
  });

  // 3. 직렬화: Date → string
  return document.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
}

export async function getDocument(id: string) {
  const document = await prisma.document.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      isNotice: true,
      isSecrets: true,
      readCount: true,
      commentCount: true,
      voteCount: true,
      user: {
        select: {
          id: true,
          nickName: true,
        },
      },
    },
  });

  if (!document) {
    return [];
  }
  return document;
}
