// src/app/(extentions)/posts/_actions/category.query.ts
import prisma from "@utils/db/prisma";
import { TreeItem } from "./_type";

export async function findCategoriesByResource(resourceType: string): Promise<TreeItem[]> {
  const categories = await prisma.category.findMany({
    where: { resourceType },
    orderBy: { order: "asc" },
  });

  return categories.map((c) => ({
    id: c.id.toString(),
    title: c.title,
    parentId: c.parentId?.toString() ?? null,
    order: c.order,
    resourceType: c.resourceType,
  }));
}

export async function insertCategory(data: { title: string; parentId: number | null; resourceType: string }) {
  return await prisma.category.create({ data });
}

export async function updateCategoryTitle(id: number, title: string) {
  return await prisma.category.update({
    where: { id },
    data: { title },
  });
}

/**
 * 재귀적 삭제 (Prisma 레벨에서 자식까지 삭제)
 */
export async function deleteCategoryRecursive(id: number): Promise<void> {
  const children = await prisma.category.findMany({
    where: { parentId: id },
  });

  for (const child of children) {
    await deleteCategoryRecursive(child.id);
  }

  await prisma.category.delete({
    where: { id },
  });
}

/**
 * 전체 트리 동기화 (트랜잭션)
 */
export async function syncCategoryTree(items: TreeItem[], resourceType: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. 기존 리소스 관련 카테고리 일괄 삭제
    await tx.category.deleteMany({ where: { resourceType } });

    // 2. 1단계: 부모 없이 모두 생성 (ID 충돌 방지 및 생성 우선)
    for (const item of items) {
      await tx.category.create({
        data: {
          id: parseInt(item.id),
          title: item.title,
          parentId: null,
          order: item.order,
          resourceType: item.resourceType || resourceType,
        },
      });
    }

    // 3. 2단계: 실제 부모 관계 업데이트
    for (const item of items) {
      if (item.parentId) {
        await tx.category.update({
          where: { id: parseInt(item.id) },
          data: { parentId: parseInt(item.parentId) },
        });
      }
    }
  }, { timeout: 10000 });
}