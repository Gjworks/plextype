"use server";

import prisma from "@plextype/utils/db/prisma";
import {
  findPostByModuleId,
  PostInfoData,
} from "@/extentions/posts/admin/scripts/data/post";

/**
 * 게시판 정보 조회 서버 액션
 * @returns PostInfoData | null
 * @param pid
 */
const getPostInfo = async (pid: string): Promise<PostInfoData | null> => {
  // 게시판 기본 정보 조회
  const postInfo = await findPostByModuleId(pid);
  if (!postInfo) return null;

  // 권한 조회
  const permissions = await prisma.permission.findMany({
    where: { resourceType: "posts", resourceId: postInfo.id },
  });

  // PostInfoData.permissions 형태로 변환
  const mappedPermissions = {
    listPermissions: permissions
      .filter((p) => p.action === "list")
      .map((p) => ({ subjectType: p.subjectType, subjectId: p.subjectId })),
    readPermissions: permissions
      .filter((p) => p.action === "read")
      .map((p) => ({ subjectType: p.subjectType, subjectId: p.subjectId })),
    writePermissions: permissions
      .filter((p) => p.action === "write")
      .map((p) => ({ subjectType: p.subjectType, subjectId: p.subjectId })),
    commentPermissions: permissions
      .filter((p) => p.action === "comment")
      .map((p) => ({ subjectType: p.subjectType, subjectId: p.subjectId })),
  };

  // 📌 카테고리 조회
  const categories = await prisma.category.findMany({
    where: {
      resourceType: "posts",
      resourceId: postInfo.id,
      parentId: null, // 최상위 카테고리만
    },
    include: {
      children: true, // 하위 카테고리까지
    },
    orderBy: {
      order: "asc",
    },
  });

  return {
    ...postInfo,
    permissions: mappedPermissions,
    categories,
  };
};

export { getPostInfo };
