// src/app/(extentions)/posts/_actions/posts.action.ts
"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { decodeJwt } from "jose";
import * as query from "./posts.query";
import * as documentQuery from "./document.query";
import { commitAttachments } from "@extentions/posts/_actions/attachment.action";
import { ActionState, DocumentUpsertSchema, PostsUpsertSchema,DocumentInfo } from "./_type";
import { validateForm } from "@/utils/validation/formValidator";
import {deletePosts} from "./posts.query";
import {redirect} from "next/navigation";

// 내부 유틸: 로그인 유저 확인
async function getLoggedInfo() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) return null;
  return decodeJwt(accessToken) as { id: number; isAdmin: boolean };
}



// ==========================================
// [ACTION - Posts] 게시판 설정(권한 포함) 조회
// ==========================================
export async function getPostsInfo(pid: string): Promise<ActionState<any>> {
  try {
    const postInfo = await query.findPostsByPid(pid);
    if (!postInfo) return { success: false, type: "error", message: "게시판을 찾을 수 없습니다." };

    const [permissions, categories] = await Promise.all([
      query.findPermissionsByResourceId(postInfo.id),
      query.findCategoriesByResourceId(postInfo.id),
    ]);

    const mappedPermissions = {
      listPermissions: permissions.filter(p => p.action === "list").map(p => ({ subjectType: p.subjectType, subjectId: p.subjectId })),
      readPermissions: permissions.filter(p => p.action === "read").map(p => ({ subjectType: p.subjectType, subjectId: p.subjectId })),
      writePermissions: permissions.filter(p => p.action === "write").map(p => ({ subjectType: p.subjectType, subjectId: p.subjectId })),
      commentPermissions: permissions.filter(p => p.action === "comment").map(p => ({ subjectType: p.subjectType, subjectId: p.subjectId })),
    };

    return {
      success: true, message: "조회 성공",
      data: { ...postInfo, permissions: mappedPermissions, categories }
    };
  } catch (error) {
    return { success: false, type: "error", message: "게시판 정보를 불러오지 못했습니다." };
  }
}

// ==========================================
// [ACTION - Posts] 게시판 자체(모듈) 설정 저장 (권한 동시 처리)
// ==========================================
export async function savePostsInfo(formData: FormData, paths?: string): Promise<ActionState<number>> {
  try {
    const loggedInfo = await getLoggedInfo();
    if (!loggedInfo?.isAdmin) return { success: false, type: "error", message: "관리자 권한이 필요합니다." };

    const formPayload = {
      id: formData.get("id"),
      pid: formData.get("pid"),
      postName: formData.get("postName"),
      postDesc: formData.get("postDesc"),
      config: JSON.parse(formData.get("config") as string || "{}"),
      permissions: JSON.parse(formData.get("permissions") as string || "{}"),
    };

    const validation = validateForm(PostsUpsertSchema, formPayload);
    if (!validation.isValid) {
      return validation.errorResponse;
    }
    const data = validation.data;

    let postId: number;
    if (data.id) {
      const updated = await query.updatePosts(data.id, { pid: data.pid, postName: data.postName, postDesc: data.postDesc, config: data.config });
      postId = updated.id;
    } else {
      const created = await query.insertPosts({ pid: data.pid, postName: data.postName, postDesc: data.postDesc, config: data.config });
      postId = created.id;
    }

    if (formPayload.permissions) {
      await query.deletePermissions(postId);
      const newPermissions = Object.entries(formPayload.permissions).flatMap(([type, list]: [string, any]) =>
        list.map((p: any) => ({
          resourceType: "posts", resourceId: postId,
          action: type.replace("Permissions", "").toLowerCase(),
          subjectType: p.subjectType, subjectId: p.subjectId ?? null,
        }))
      );
      await query.insertPermissions(newPermissions);
    }

    if (paths) {
      revalidatePath(paths);
    }
    return { success: true, type: "success", message: "게시판 설정이 저장되었습니다.", data: postId };
  } catch (error) {
    return { success: false, type: "error", message: "게시판 저장 중 오류가 발생했습니다." };
  }
}

export async function getPostsList(page: number = 1, pageSize: number = 10, keyword?: string): Promise<ActionState<any>> {
  try {
    // 💡 1. 창고(Query)에서는 날것의 데이터만 가져옵니다.
    const { items, totalCount } = await query.findPostsList(page, pageSize, keyword);

    // 💡 2. 매니저(Action)가 화면(UI)에서 쓰기 좋게 pagination 객체를 조립해줍니다!
    const pagination = {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      page,
      listCount: items.length,
    };

    return {
      success: true,
      type: "success",
      message: "게시판 목록 조회 성공",
      data: {
        items,        // 알맹이 1
        pagination    // 알맹이 2 (완벽 포장!)
      }
    };
  } catch (error) {
    console.error("getPostsList 에러:", error);
    return { success: false, type: "error", message: "게시판 목록을 불러오는 중 오류가 발생했습니다." };
  }
}

// src/app/(extentions)/posts/_actions/posts.action.ts 에 추가

export async function getPostsInfoById(id: number): Promise<ActionState<any>> {
  try {
    // 💡 1. PID가 아닌 PK(id)로 게시판을 찾습니다. (쿼리에 findPostsById 가 있다고 가정)
    const postInfo = await query.findPostsById(id);
    if (!postInfo) return { success: false, type: "error", message: "게시판을 찾을 수 없습니다." };

    const [permissions, categories] = await Promise.all([
      query.findPermissionsByResourceId(postInfo.id),
      query.findCategoriesByResourceId(postInfo.id),
    ]);

    // ... (기존 getPostsInfo와 동일한 권한 매핑 로직) ...
    const mappedPermissions = {
      listPermissions: permissions.filter(p => p.action === "list").map(p => ({ subjectType: p.subjectType, subjectId: p.subjectId })),
      readPermissions: permissions.filter(p => p.action === "read").map(p => ({ subjectType: p.subjectType, subjectId: p.subjectId })),
      writePermissions: permissions.filter(p => p.action === "write").map(p => ({ subjectType: p.subjectType, subjectId: p.subjectId })),
      commentPermissions: permissions.filter(p => p.action === "comment").map(p => ({ subjectType: p.subjectType, subjectId: p.subjectId })),
    };

    return {
      success: true,
      message: "조회 성공",
      data: { ...postInfo, permissions: mappedPermissions, categories }
    };
  } catch (error) {
    return { success: false, type: "error", message: "정보를 불러오지 못했습니다." };
  }
}


export async function removePostsAction(ids: number[], paths?: string): Promise<ActionState<null>> {
  try {
    const loggedInfo = await getLoggedInfo();
    if (!loggedInfo?.isAdmin) return { success: false, message: "권한이 없습니다." };

    if (!ids || ids.length === 0) {
      return { success: false, message: "삭제할 항목을 선택해주세요." };
    }

    await deletePosts(ids);

    if (paths) {
      revalidatePath(paths);
    }

    return {
      success: true,
      type: "success",
      message: `${ids.length}개의 게시판이 삭제되었습니다.`
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "삭제 중 오류가 발생했습니다." };
  }
}