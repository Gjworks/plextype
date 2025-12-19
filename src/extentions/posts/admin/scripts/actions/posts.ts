"use server"

import prisma from "@plextype/utils/db/prisma";
import { PostListResponse } from "@plextype/types/posts";

export async function getPosts(page: number = 1, pageSize: number = 10): Promise<PostListResponse> {
  try {
    const [items, totalCount] = await Promise.all([
      prisma.posts.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.posts.count(),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      items,
      pagination: {
        totalCount,
        totalPages,
        page,
        listCount: items.length, // 현재 페이지에 표시되는 실제 데이터 개수
      },
    };
  } catch (err) {
    console.error("게시판 목록 조회 에러:", err);
    throw new Error("게시판 목록을 불러올 수 없습니다.");
  }
}