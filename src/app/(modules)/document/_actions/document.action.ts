// src/app/(extentions)/posts/_actions/document.action.ts
'use server'

import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import dayjs from "dayjs";
import * as query from "./document.query";
import { revalidatePath } from "next/cache";
import * as postsQuery from "../../posts/_actions/posts.query"; // 게시판 정보 조회를 위해 필요
import { ActionState, DocumentUpsertSchema, DocumentInfo } from "../../document/_actions/_type";
import { validateForm } from "@utils/validation/formValidator";
import * as documentQuery from "@modules/document/_actions/document.query";

// 내부 유틸: 로그인 유저 확인
async function getLoggedInfo() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) return null;
  return decodeJwt(accessToken) as { id: number; isAdmin: boolean };
}

export async function getDocument(id: number): Promise<ActionState<DocumentInfo>> {
  try {
    const document = await documentQuery.findDocument(id);
    if (!document) {
      return {
        success: false,
        type: "error",
        message: "존재하지 않는 게시글입니다."
      };
    }

    // ✅ 성공 시에도 message와 type을 명시하여 ActionState 규격을 맞춥니다.
    return {
      success: true,
      type: "success", // 생략 가능하게 정의되어 있지 않다면 추가
      message: "게시글 조회 성공",
      data: document as DocumentInfo
    };
  } catch (error) {
    console.error("getDocument 에러:", error);
    return {
      success: false,
      type: "error",
      message: "게시글을 불러오는 중 오류가 발생했습니다."
    };
  }
}

// ==========================================
// [ACTION - Document] 게시글 저장/수정
// ==========================================
// src/app/(extentions)/posts/_actions/document.action.ts

export const saveDocument = async (mid: string, formData: FormData, paths?: string): Promise<ActionState<number>> => {
  try {
    const loggedInfo = await getLoggedInfo();
    if (!loggedInfo) return { success: false, type: "error", message: "로그인이 필요합니다." };

    const postInfo = await postsQuery.findModuleByMid(mid);
    if (!postInfo) return { success: false, type: "error", message: "존재하지 않는 게시판입니다." };

    // 🌟 [추가] 확장 필드 데이터 추출 로직
    const extraFieldData: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (key.startsWith("extraData__")) {
        const cleanKey = key.replace("extraData__", "");
        extraFieldData[cleanKey] = value;
      }
    });

    const formPayload = {
      id: formData.get("id"),
      categoryId: formData.get("categoryId"),
      title: formData.get("title"),
      content: formData.get("content"),
      isNotice: formData.get("isNotice"),
      isSecrets: formData.get("isSecrets"),
      moduleId: postInfo.id,
      moduleType: "posts",
      tempId: formData.get("tempId"),
      // 🌟 추출한 데이터를 페이로드에 포함
      extraFieldData: extraFieldData,
    };

    // validation 시 DocumentUpsertSchema에 extraFieldData가 정의되어 있어야 합니다.
    const validation = validateForm(DocumentUpsertSchema, formPayload);
    if (!validation.isValid) return validation.errorResponse;
    const data = validation.data;

    let resultId: number;

    if (data.id) {
      const existing = await documentQuery.findDocument(data.id);
      if (!existing) return { success: false, type: "error", message: "글을 찾을 수 없습니다." };
      if (existing.userId !== loggedInfo.id && !loggedInfo.isAdmin) {
        return { success: false, type: "error", message: "수정 권한이 없습니다." };
      }

      // 🌟 업데이트 시 extraFieldData 포함
      const updated = await documentQuery.updateDocument(data.id, {
        title: data.title,
        content: data.content,
        categoryId: data.categoryId,
        isNotice: data.isNotice,
        isSecrets: data.isSecrets,
        extraFieldData: data.extraFieldData, // 추가
        updatedAt: new Date()
      });
      resultId = updated.id;
    } else {
      // 🌟 신규 등록 시 extraFieldData 포함
      const created = await documentQuery.insertDocument({
        moduleType: data.moduleType,
        moduleId: data.moduleId,
        title: data.title,
        content: data.content,
        userId: loggedInfo.id,
        categoryId: data.categoryId,
        isNotice: data.isNotice,
        isSecrets: data.isSecrets,
        extraFieldData: data.extraFieldData, // 추가
        authorName: "작성자",
        published: true,
      });
      resultId = created.id;
    }

    if (paths) {
      revalidatePath(paths);
    }

    return { success: true, type: "success", message: "저장되었습니다.", data: resultId };
  } catch (error) {
    console.error("saveDocument 에러:", error);
    return { success: false, type: "error", message: "게시글 저장 중 오류가 발생했습니다." };
  }
};

// ==========================================
// [ACTION - Document] 게시글 목록 조회 (썸네일 파싱 포함)
// ==========================================
export async function getDocumentList(
  mid: string,
  page: number = 1,
  pageSize: number = 10,
  categoryId?: string
): Promise<ActionState<any>> {
  try {
    // 1. 게시판(모듈) 정보 확인
    const postInfo = await postsQuery.findModuleByMid(mid);
    if (!postInfo) return { success: false, type: "error", message: "게시판을 찾을 수 없습니다." };

    const parsedCategoryId = categoryId ? Number(categoryId) : undefined;

    // 🌟 [중요] documentQuery.findDocumentList에서 extraFieldData를 select/include 하고 있는지 확인해야 합니다.
    const { items, totalCount } = await documentQuery.findDocumentList(postInfo.id, page, pageSize, parsedCategoryId);

    const formattedItems = items.map((doc: any) => {
      let previewContent = "";
      let thumbnail: string | null = null;

      // --- 기존 컨텐츠 파싱 로직 (유지) ---
      if (doc.content) {
        try {
          let rawContent = doc.content;
          if (rawContent.startsWith('"') && rawContent.endsWith('"')) rawContent = rawContent.slice(1, -1);
          const parsed = JSON.parse(rawContent);

          if (parsed.type === "doc" && Array.isArray(parsed.content)) {
            const findFirstImage = (nodes: any[]): string | null => {
              for (const node of nodes) {
                if (node.type === 'image' && node.attrs?.src) return node.attrs.src;
                if (node.content) {
                  const nested = findFirstImage(node.content);
                  if (nested) return nested;
                }
              }
              return null;
            };
            thumbnail = findFirstImage(parsed.content) || "";

            const extractText = (nodes: any[]): string => {
              let text = "";
              nodes.forEach(n => {
                if (n.type === "text" && n.text) text += n.text;
                else if (n.content) text += extractText(n.content) + " ";
              });
              return text;
            };
            const fullText = extractText(parsed.content);
            previewContent = fullText.length > 150 ? fullText.slice(0, 150).trim() + "..." : fullText.trim();
          } else if (parsed.blocks) {
            const imageBlock = parsed.blocks.find((b: any) => b.type === 'image');
            if (imageBlock?.data?.file?.url) thumbnail = imageBlock.data.file.url;
            previewContent = parsed.blocks.slice(0, 3).map((b: any) => (b.data?.text || "").replace(/<[^>]+>/g, "")).join(" ");
          }
        } catch (e) {
          previewContent = doc.content.replace(/<[^>]+>/g, "").slice(0, 150);
        }
      }

      // 🌟 [추가] extraFieldData가 문자열로 저장되어 있을 경우를 대비한 안전한 파싱
      let extraFieldData = doc.extraFieldData || {};
      if (typeof extraFieldData === 'string') {
        try {
          extraFieldData = JSON.parse(extraFieldData);
        } catch (e) {
          extraFieldData = {};
        }
      }

      const latestComment = doc.Comment && doc.Comment.length > 0
        ? doc.Comment[0]
        : null;

      return {
        ...doc,
        content: previewContent,
        thumbnail,
        extraFieldData,
        latestComment
      };
    });

    return {
      success: true,
      message: "조회 성공",
      data: {
        documentList: formattedItems,
        navigation: {
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
          page,
          listCount: formattedItems.length
        }
      }
    };
  } catch (error) {
    console.error("getDocumentList 에러:", error);
    return { success: false, type: "error", message: "목록 조회 중 오류가 발생했습니다." };
  }
}

// ==========================================
// [ACTION - Document] 게시글 삭제
// ==========================================
export async function removeDocument(id: number, mid: string): Promise<ActionState<null>> {
  try {
    const loggedInfo = await getLoggedInfo();
    if (!loggedInfo) return { success: false, type: "error", message: "로그인이 필요합니다." };

    const doc = await documentQuery.findDocument(id);
    if (!doc) return { success: false, type: "error", message: "이미 삭제되었거나 존재하지 않는 글입니다." };

    if (doc.userId !== loggedInfo.id && !loggedInfo.isAdmin) {
      return { success: false, type: "error", message: "삭제 권한이 없습니다." };
    }

    await documentQuery.deleteDocument(id);
    revalidatePath(`/posts/${mid}`);

    return { success: true, type: "success", message: "게시글이 삭제되었습니다." };
  } catch (error) {
    console.error("removeDocument 에러:", error);
    return { success: false, type: "error", message: "삭제 중 오류가 발생했습니다." };
  }
}


/**
 * [Action] 조회수 증가 (1시간 중복 방지)
 */
export async function increaseViewCount(documentId: number, userId?: number, ip?: string): Promise<void> {
  try {
    const oneHourAgo = dayjs().subtract(1, "hour").toDate();

    // 1. 최근 조회 기록 확인 (Query 호출)
    const exists = await query.findRecentViewLog(documentId, oneHourAgo, userId, ip);

    // 2. 기록이 없으면 증가 (Query 트랜잭션 호출)
    if (!exists) {
      await query.incrementReadCountWithLog(documentId, userId, ip);
    }
  } catch (error) {
    // 조회수 증가는 실패해도 사용자 서비스에 치명적이지 않으므로 로그만 남깁니다.
    console.error("increaseViewCount 에러:", error);
  }
}


