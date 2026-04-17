// src/app/(extentions)/posts/_actions/posts.action.ts
"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { decodeJwt } from "jose";
import * as query from "./posts.query";

import {ActionState, PostsUpsertSchema, DocumentInfo, ExtraFieldConfig} from "./_type";
import { validateForm } from "@utils/validation/formValidator";
import {deletePosts, findPostsById, findPostsByPid, updateModuleFieldSchema} from "./posts.query";
import {redirect} from "next/navigation";

// 내부 유틸: 로그인 유저 확인
async function getLoggedInfo() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) return null;
  return decodeJwt(accessToken) as { id: number; isAdmin: boolean };
}


// ==========================================
// [ACTION - Modules] 모듈 설정(설계도/권한 포함) 조회
// ==========================================
export async function getModuleInfo(mid: string): Promise<ActionState<any>> {
  try {
    // 1. 모듈 정보 조회 (FieldGroup을 include해서 설계도까지 한 번에 가져옵니다)
    const moduleInfo = await query.findModuleByMid(mid);

    if (!moduleInfo) {
      return { success: false, type: "error", message: "모듈을 찾을 수 없습니다." };
    }

    // 2. 권한과 카테고리 조회 (새로 만든 moduleId 기반 쿼리 사용)
    const [permissions, categories] = await Promise.all([
      query.findPermissionsByModuleId(moduleInfo.id),
      query.findCategoriesByModuleId(moduleInfo.id),
    ]);

    // 3. 확장 필드 설계도 추출
    // 이제 postInfo.extraFields가 아니라 FieldGroup 안에 들어있습니다!
    const extraFields = (moduleInfo.FieldGroup?.fields as unknown as ExtraFieldConfig[]) || [];

    // 4. 권한 매핑 (기존 로직 유지하되 필드명 대응)
    const mappedPermissions = {
      listPermissions: permissions
        .filter(p => p.action === "list")
        .map(p => ({ subjectType: p.subjectType, subjectId: p.subjectId })),
      readPermissions: permissions
        .filter(p => p.action === "read")
        .map(p => ({ subjectType: p.subjectType, subjectId: p.subjectId })),
      writePermissions: permissions
        .filter(p => p.action === "write")
        .map(p => ({ subjectType: p.subjectType, subjectId: p.subjectId })),
      commentPermissions: permissions
        .filter(p => p.action === "comment")
        .map(p => ({ subjectType: p.subjectType, subjectId: p.subjectId })),
    };

    return {
      success: true,
      message: "조회 성공",
      data: {
        ...moduleInfo,        // 모듈 기본 정보
        extraFields,         // FieldGroup에서 가져온 설계도
        permissions: mappedPermissions,
        categories
      }
    };
  } catch (error) {
    console.error("getModuleInfo Error:", error);
    return { success: false, type: "error", message: "모듈 정보를 불러오지 못했습니다." };
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
      mid: formData.get("mid"),
      moduleName: formData.get("moduleName"),
      moduleDesc: formData.get("moduleDesc"),
      config: JSON.parse(formData.get("config") as string || "{}"),
      permissions: JSON.parse(formData.get("permissions") as string || "{}"),
    };

    console.log(formPayload)

    const validation = validateForm(PostsUpsertSchema, formPayload);
    if (!validation.isValid) {
      return validation.errorResponse;
    }
    const data = validation.data;

    let postId: number;
    if (data.id) {
      const updated = await query.updatePosts(data.id, { mid: data.mid, moduleName: data.moduleName, moduleDesc: data.moduleDesc, config: data.config });
      postId = updated.id;
    } else {
      const created = await query.insertPosts({ mid: data.mid, moduleName: data.moduleName, moduleDesc: data.moduleDesc, config: data.config });
      postId = created.id;
    }

    if (formPayload.permissions) {
      await query.deletePermissions(postId);
      const newPermissions = Object.entries(formPayload.permissions).flatMap(([type, list]: [string, any]) =>
        list.map((p: any) => ({
          moduleType: "posts", moduleId: postId,
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


export async function getPostsInfo(mid: string): Promise<ActionState<any>> {
  try {
    // 1. 게시판 정보를 가져올 때, 쿼리(findPostsByPid)에서
    // 반드시 'FieldGroup'을 include해서 가져오도록 되어 있어야 합니다!
    const postInfo = await query.findPostsByPid(mid);
    if (!postInfo) return { success: false, type: "error", message: "게시판을 찾을 수 없습니다." };

    const [permissions, categories] = await Promise.all([
      query.findPermissionsByModuleId(postInfo.id),
      query.findCategoriesByModuleId(postInfo.id),
    ]);

    // 🌟 2. 확장 필드 설계도(fields) 추출
    const extraFields = postInfo.FieldGroup?.fields || [];

    // 권한 매핑 로직 (기존 유지)
    const mappedPermissions = {
      listPermissions: permissions.filter(p => p.action === "list").map(p => ({ subjectType: p.subjectType, subjectId: p.subjectId })),
      readPermissions: permissions.filter(p => p.action === "read").map(p => ({ subjectType: p.subjectType, subjectId: p.subjectId })),
      writePermissions: permissions.filter(p => p.action === "write").map(p => ({ subjectType: p.subjectType, subjectId: p.subjectId })),
      commentPermissions: permissions.filter(p => p.action === "comment").map(p => ({ subjectType: p.subjectType, subjectId: p.subjectId })),
    };

    return {
      success: true,
      message: "조회 성공",
      data: {
        ...postInfo,
        extraFields,
        permissions: mappedPermissions,
        categories
      }
    };
  } catch (error) {
    console.error(error);
    return { success: false, type: "error", message: "정보를 불러오지 못했습니다." };
  }
}


export async function getPostsInfoById(id: number): Promise<ActionState<any>> {
  try {
    // 💡 1. PID가 아닌 PK(id)로 게시판을 찾습니다. (쿼리에 findPostsById 가 있다고 가정)
    const postInfo = await query.findPostsById(id);
    if (!postInfo) return { success: false, type: "error", message: "게시판을 찾을 수 없습니다." };

    const [permissions, categories] = await Promise.all([
      query.findPermissionsByModuleId(postInfo.id),
      query.findCategoriesByModuleId(postInfo.id),
    ]);

    const extraFields = postInfo.FieldGroup?.fields || [];

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
      data: { ...postInfo,extraFields, permissions: mappedPermissions, categories }
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

export async function savePostConfigAction(mid: string, extraFields: ExtraFieldConfig[]) {
  try {
    // 1. query.ts에 만든 함수를 실행합니다.
    await query.updateModuleFieldSchema(mid, extraFields);

    // 2. 변경된 데이터를 화면에 즉시 반영하기 위해 캐시를 갱신합니다.
    revalidatePath(`/admin/posts/${mid}`);
    revalidatePath(`/posts/${mid}/write`);

    return { success: true };
  } catch (error) {
    console.error("[SavePostConfig Error]:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "설정 저장에 실패했습니다."
    };
  }
}