"use server";
import prisma from "@plextype/utils/db/prisma";

export type TreeItem = {
    id: string;
    title: string;
    parentId: string | null;
    order: number;
    resourceType: string;
};

/**
 * 전체 카테고리 가져오기
 */
export async function getCategories(resourceType: string): Promise<TreeItem[]> {
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

/**
 * 카테고리 추가
 */
export async function addCategory(
    title: string,
    parentId: string | null = null,
    resourceType: string = "post",
): Promise<TreeItem> {
    const newCategory = await prisma.category.create({
        data: {
            title,
            parentId: parentId ? parseInt(parentId) : null,
            order: 0, // 기본값, 필요 시 계산해서 넣어도 됨
            resourceType,
        },
    });

    return {
        id: newCategory.id.toString(),
        title: newCategory.title,
        parentId: newCategory.parentId?.toString() ?? null,
        order: newCategory.order,
        resourceType: newCategory.resourceType,
    };
}

/**
 * 카테고리 수정
 */
export async function updateCategory(
    id: string,
    title: string,
): Promise<TreeItem> {
    const updated = await prisma.category.update({
        where: { id: parseInt(id) },
        data: { title },
    });

    return {
        id: updated.id.toString(),
        title: updated.title,
        parentId: updated.parentId?.toString() ?? null,
        order: updated.order,
        resourceType: updated.resourceType,
    };
}

/**
 * 카테고리 삭제 (하위 항목도 함께 삭제)
 */
export async function deleteCategory(id: string): Promise<void> {
    const children = await prisma.category.findMany({
        where: { parentId: parseInt(id) },
    });

    for (const child of children) {
        await deleteCategory(child.id.toString());
    }

    await prisma.category.delete({
        where: { id: parseInt(id) },
    });
}

/**
 * 전체 트리 저장 (서버에서 받아서 한 번에 저장)
 */
export async function saveCategories(items: TreeItem[], resourceType: string) {
    await prisma.$transaction(async (tx) => {
        // 기존 데이터 삭제
        await tx.category.deleteMany({ where: { resourceType } });

        // 새로 삽입
        for (const item of items) {
            await tx.category.create({
                data: {
                    id: parseInt(item.id),
                    title: item.title,
                    parentId: item.parentId ? parseInt(item.parentId) : null,
                    order: item.order,
                    resourceType: item.resourceType || resourceType,
                },
            });
        }
    });
}