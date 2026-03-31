// src/app/(extentions)/posts/_actions/posts.query.ts
import prisma from "@utils/db/prisma";
import { Prisma } from "@prisma/client";
import { PostsParams, ExtraFieldConfig } from "./_type"; // 경로에 맞게 호출

// ==========================================
// [Document] 실제 게시글 관련 쿼리
// ==========================================

export async function findModuleByMid(mid: string) {
  return prisma.modules.findUnique({
    where: { mid },
    // 🌟 이 부분이 없으면 FieldGroup 데이터를 가져오지 않습니다!
    include: {
      FieldGroup: true,
    },
  });
}

export async function findPostsList(page: number = 1, pageSize: number = 10, keyword?: string) {
  const whereCondition: Prisma.ModulesWhereInput = keyword
    ? { OR: [{ mid: { contains: keyword } }, { moduleName: { contains: keyword } }] }
    : {};

  const [items, totalCount] = await Promise.all([
    prisma.modules.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.modules.count({ where: whereCondition }),
  ]);

  return { items, totalCount };
}

export async function insertPosts(data: PostsParams) {
  return prisma.modules.create({ data });
}

export async function updatePosts(id: number, data: PostsParams) {
  return prisma.modules.update({ where: { id }, data });
}

// ==========================================
// [Category & Permission] 부가 정보 쿼리
// ==========================================

export async function findCategoriesByModuleId(moduleId: number) {
  return prisma.category.findMany({
    where: { moduleType: "posts", moduleId, parentId: null },
    include: { children: true },
    orderBy: { order: "asc" },
  });
}

export async function findPermissionsByModuleId(moduleId: number) {
  return prisma.permission.findMany({
    where: { moduleType: "posts", moduleId },
  });
}

export async function deletePermissions(moduleId: number) {
  return prisma.permission.deleteMany({
    where: { moduleType: "posts", moduleId },
  });
}

export async function insertPermissions(data: Prisma.PermissionCreateManyInput[]) {
  if (data.length === 0) return;
  return prisma.permission.createMany({ data });
}

export async function findPostsById(id: number) {
  return prisma.modules.findUnique({
    where: { id },
  });
}

export async function findModuleById(id: number) {
  return prisma.modules.findUnique({
    where: { id },
    // 🌟 이 부분을 추가해야 설계도(FieldGroup)를 함께 가져옵니다.
    include: {
      FieldGroup: true,
    },
  });
}

export async function findPostsByPid(mid: string) {
  return prisma.modules.findUnique({
    where: { mid },
  });
}

export async function deletePosts(ids: number[]) {
  return prisma.$transaction(async (tx) => {
    // 1. 선택된 게시판들의 권한 데이터 일괄 삭제
    await tx.permission.deleteMany({
      where: {
        moduleType: "posts",
        moduleId: { in: ids },
      },
    });

    // 2. 게시판 데이터 일괄 삭제
    const result = await tx.modules.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return result;
  });
}


export async function updateModuleFieldSchema(mid: string, fields: ExtraFieldConfig[]) {
  // 1. 변수명을 module -> foundModule 로 변경합니다.
  const foundModule = await prisma.modules.findUnique({
    where: { mid: mid },
    select: { fieldGroupId: true }
  });

  // 2. 체크 로직에서도 변경된 변수명을 사용합니다.
  if (!foundModule?.fieldGroupId) {
    throw new Error("이 모듈에 연결된 필드 그룹이 없습니다.");
  }

  // 3. 찾은 fieldGroupId의 fields를 업데이트합니다.
  return prisma.fieldGroup.update({
    where: { id: foundModule.fieldGroupId },
    data: {
      // 💡 Prisma JSON 필드 저장을 위한 타입 캐스팅 유지
      fields: fields as unknown as Prisma.InputJsonValue,
    },
  });
}