// src/app/(extentions)/posts/_actions/category.action.ts
"use server";

import { revalidatePath } from "next/cache";
import * as query from "./category.query";
import { ActionState, TreeItem } from "./_type";

/**
 * [GET] 카테고리 목록 조회
 */
export async function getCategoriesAction(resourceType: string = "posts"): Promise<ActionState<TreeItem[]>> {
  try {
    const data = await query.findCategoriesByResource(resourceType);
    return { success: true, message: "카테고리 조회 성공", data };
  } catch (error) {
    return { success: false, message: "카테고리를 불러오지 못했습니다." };
  }
}

/**
 * [ADD] 카테고리 추가
 */
export async function addCategoryAction(title: string, parentId: string | null = null, resourceType: string = "posts"): Promise<ActionState<any>> {
  try {
    const result = await query.insertCategory({
      title,
      parentId: parentId ? parseInt(parentId) : null,
      resourceType
    });
    return { success: true, message: "카테고리가 추가되었습니다.", data: result };
  } catch (error) {
    return { success: false, message: "카테고리 추가 실패" };
  }
}

/**
 * [RENAME] 카테고리 이름 변경
 */
export async function renameCategoryAction(id: string, title: string): Promise<ActionState<any>> {
  try {
    const result = await query.updateCategoryTitle(parseInt(id), title);
    return { success: true, message: "이름이 변경되었습니다.", data: result };
  } catch (error) {
    return { success: false, message: "이름 변경 실패" };
  }
}

/**
 * [REMOVE] 카테고리 삭제
 */
export async function removeCategoryAction(id: string, path?: string): Promise<ActionState<null>> {
  try {
    await query.deleteCategoryRecursive(parseInt(id));
    if (path) revalidatePath(path);
    return { success: true, message: "카테고리가 삭제되었습니다." };
  } catch (error) {
    return { success: false, message: "카테고리 삭제 실패" };
  }
}

/**
 * [SAVE] 트리 전체 저장
 */
export async function saveCategoryTreeAction(items: TreeItem[], resourceType: string = "posts", path?: string): Promise<ActionState<null>> {
  try {
    await query.syncCategoryTree(items, resourceType);
    if (path) revalidatePath(path);
    return { success: true, message: "카테고리 구조가 저장되었습니다." };
  } catch (error) {
    console.error("saveCategoryTreeAction Error:", error);
    return { success: false, message: "트리 저장 중 오류가 발생했습니다." };
  }
}