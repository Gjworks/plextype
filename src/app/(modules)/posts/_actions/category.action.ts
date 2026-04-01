// src/app/(extentions)/posts/_actions/category.action.ts
"use server";

import { revalidatePath } from "next/cache";
import * as query from "./category.query";
import { ActionState, TreeItem } from "./_type";

export async function getCategoriesAction(
  moduleId: number,
  moduleType: string = "posts"
): Promise<ActionState<TreeItem[]>> {

  const numericModuleId = Number(moduleId);

  if (isNaN(numericModuleId)) {
    return { success: true, message: "유효하지 않은 모듈 ID입니다.", data: [] };
  }

  try {
    const data = await query.findCategoriesByModuleId(moduleType, numericModuleId);

    // 🌟 2단계: 평면 데이터를 트리 구조로 재구성 (Nest 로직)
    const tree = listToTree(data);

    return {
      success: true,
      message: data.length > 0 ? "조회 성공" : "등록된 카테고리가 없습니다.",
      data: tree
    };
  } catch (error) {
    console.error("카테고리 로드 에러:", error);
    return { success: false, message: "DB 조회 중 오류가 발생했습니다.", data: [] };
  }
}

// 트리 변환 도우미 함수
function listToTree(list: TreeItem[]): TreeItem[] {
  const map: { [key: string]: number } = {};
  const tree: TreeItem[] = [];

  list.forEach((node, i) => { map[node.id] = i; node.children = []; });

  list.forEach((node) => {
    if (node.parentId !== null && map[node.parentId] !== undefined) {
      list[map[node.parentId]].children.push(node);
    } else {
      tree.push(node);
    }
  });
  return tree;
}

/**
 * [ACTION] 카테고리 추가
 * @param title 카테고리 명
 * @param parentId 부모 ID (DnD-kit 특성상 string으로 올 수 있음)
 * @param moduleId 모듈 고유 ID (숫자)
 * @param moduleType 모듈 타입 (기본값 "posts")
 */
export async function addCategoryAction(
  title: string,
  parentId: string | null = null,
  moduleId: number,
  moduleType: string = "posts"
): Promise<ActionState<any>> {
  try {
    // 🌟 1. parentId 보정 로직
    // 값이 없거나, "null"(문자열), 혹은 0(잘못된 변환)인 경우 모두 확실히 null로 바꿉니다.
    let numericParentId: number | null = null;

    if (parentId && parentId !== "null" && parentId !== "0" && parentId !== "") {
      numericParentId = Number(parentId);

      // 만약 변환 결과가 숫자가 아니면(NaN) 부모가 없는 것으로 간주하거나 에러 처리
      if (isNaN(numericParentId)) {
        numericParentId = null;
      }
    }

    const result = await query.insertCategory({
      title,
      parentId: numericParentId, // 🌟 이제 확실히 유효한 ID거나 null입니다.
      moduleId: Number(moduleId),
      moduleType,
      order: 0
    });

    return { success: true, message: "카테고리가 추가되었습니다.", data: result };
  } catch (error: any) {
    // 외래키 에러(P2003)일 경우 사용자에게 더 친절하게 안내
    console.log(error)
    if (error.code === 'P2003') {
      return { success: false, message: "지정한 부모 카테고리를 찾을 수 없습니다." };
    }

    console.error("❌ addCategoryAction Error:", error);
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
export async function saveCategoryTreeAction(items: TreeItem[], moduleType: string = "posts", path?: string): Promise<ActionState<null>> {
  try {

    await query.syncCategoryTree(items, moduleType);
    if (path) revalidatePath(path);
    return { success: true, message: "카테고리 구조가 저장되었습니다." };
  } catch (error) {
    console.error("saveCategoryTreeAction Error:", error);
    return { success: false, message: "트리 저장 중 오류가 발생했습니다." };
  }
}