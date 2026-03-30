// src/app/(extentions)/posts/_actions/posts.query.ts
import prisma from "@utils/db/prisma";
import { Prisma } from "@prisma/client";
import { PostsParams, ExtraFieldConfig } from "./_type"; // 경로에 맞게 호출
// ==========================================
// [Document] 실제 게시글 관련 쿼리
// ==========================================


export async function findPostsByPid(pid: string) {
  return prisma.posts.findUnique({ where: { pid } });
}

export async function findPostsList(page: number = 1, pageSize: number = 10, keyword?: string) {
  const whereCondition: Prisma.PostsWhereInput = keyword
    ? { OR: [{ pid: { contains: keyword } }, { postName: { contains: keyword } }] }
    : {};

  const [items, totalCount] = await Promise.all([
    prisma.posts.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.posts.count({ where: whereCondition }),
  ]);

  return { items, totalCount };
}

export async function insertPosts(data: PostsParams) {
  return prisma.posts.create({ data });
}

export async function updatePosts(id: number, data: PostsParams) {
  return prisma.posts.update({ where: { id }, data });
}

// ==========================================
// [Category & Permission] 부가 정보 쿼리
// ==========================================

export async function findCategoriesByResourceId(resourceId: number) {
  return prisma.category.findMany({
    where: { resourceType: "posts", resourceId, parentId: null },
    include: { children: true },
    orderBy: { order: "asc" },
  });
}

export async function findPermissionsByResourceId(resourceId: number) {
  return prisma.permission.findMany({
    where: { resourceType: "posts", resourceId },
  });
}

export async function deletePermissions(resourceId: number) {
  return prisma.permission.deleteMany({
    where: { resourceType: "posts", resourceId },
  });
}

export async function insertPermissions(data: Prisma.PermissionCreateManyInput[]) {
  if (data.length === 0) return;
  return prisma.permission.createMany({ data });
}

export async function findPostsById(id: number) {
  return prisma.posts.findUnique({
    where: { id },
  });
}

export async function deletePosts(ids: number[]) {
  return prisma.$transaction(async (tx) => {
    // 1. 선택된 게시판들의 권한 데이터 일괄 삭제
    await tx.permission.deleteMany({
      where: {
        resourceType: "posts",
        resourceId: { in: ids },
      },
    });

    // 2. 게시판 데이터 일괄 삭제
    const result = await tx.posts.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return result;
  });
}

export async function updatePostExtraFields(pid: string, extraFields: ExtraFieldConfig[]) {
  return prisma.posts.update({
    where: { pid },
    data: {
      // 💡 Prisma.InputJsonValue로 캐스팅하여 에러 해결
      extraFields: extraFields as unknown as Prisma.InputJsonValue,
    },
  });
}