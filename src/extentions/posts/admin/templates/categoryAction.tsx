"use server";

import * as categoryController from "@/extentions/posts/admin/scripts/actions/categoryController";

/**
 * 전체 카테고리 가져오기
 */
export async function fetchCategories(resourceType: string) {
    return await categoryController.getCategories(resourceType);
}

/**
 * 카테고리 추가
 */
export async function addCategory(title: string, parentId: string | null = null, resourceType: string = "posts") {
    return await categoryController.addCategory(title, parentId, resourceType);
}

/**
 * 카테고리 이름 변경
 */
export async function renameCategory(id: string, title: string) {
    return await categoryController.updateCategory(id, title);
}

/**
 * 카테고리 삭제
 */
export async function deleteCategory(id: string) {
    return await categoryController.deleteCategory(id);
}

/**
 * 전체 트리 저장
 */
export async function saveTree(items: categoryController.TreeItem[], resourceType: string = "posts") {
    return await categoryController.saveCategories(items, resourceType);
}