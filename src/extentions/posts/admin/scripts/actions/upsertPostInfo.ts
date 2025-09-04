"use server";

import prisma from "@plextype/utils/db/prisma";
import type { Prisma } from "@prisma/client";

import {
  updatePost,
  createPost,
} from "@/extentions/posts/admin/scripts/data/post";
import type { PostInfoData } from "@/extentions/posts/admin/scripts/data/post";

/**
 * 게시판 정보 업데이트 서버 액션
 * @param id 게시판 ID
 * @param data 업데이트할 PostInfoData
 */
export async function upsertPostInfo(id: number | null, data: PostInfoData) {
  try {
    let postId: number;

    if (id) {
      // 기존 게시판 업데이트
      await updatePost(id, data);
      postId = id;
    } else {
      // 새 게시판 생성
      const newPost = await createPost(data);
      postId = newPost.id;
    }

    // 1. 기존 권한 삭제
    await prisma.permission.deleteMany({
      where: {
        resourceType: "posts",
        resourceId: postId,
      },
    });

    // 2. 새 권한 생성
    const newPermissions = Object.entries(data.permissions).flatMap(
      ([type, list]) =>
        list.map((p) => ({
          resourceType: "posts",
          resourceId: postId,
          action: type.replace("Permissions", "").toLowerCase(),
          subjectType: p.subjectType,
          subjectId: p.subjectId ?? null,
        })),
    );

    if (newPermissions.length > 0) {
      await prisma.permission.createMany({ data: newPermissions });
    }

    return postId;
  } catch (error) {
    console.error("게시판 업서트 실패:", error);
    throw new Error("게시판 업서트 중 오류가 발생했습니다.");
  }
}
