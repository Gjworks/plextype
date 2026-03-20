
"use server";

import path from "path";
import { rename, mkdir, rmdir, unlink } from "fs/promises";
import { cookies } from "next/headers";
import { verify } from "@utils/auth/jwtAuth";
import { decodeJwt } from "jose";
import * as query from "./attachment.query";
import {ActionState, Attachment} from "@extentions/posts/_actions/_type"; // 쿼리 함수들 임포트

/**
 * 게시글 저장 시 임시 파일을 실제 경로로 이동 및 DB 확정
 */
export async function commitAttachments(
  tempId: string,
  newDocumentId: number
): Promise<void> {
  try {
    console.log(newDocumentId)
    // 🌟 이 한 줄이면 끝납니다. 물리적 파일은 이미 유저 폴더에 잘 있습니다.
    await query.linkAttachmentsToDocument(tempId, newDocumentId);

    console.log(`[Link Success] TempId: ${tempId} -> DocId: ${newDocumentId}`);
  } catch (error) {
    console.error("[Commit Action Error]:", error);
  }
}

/**
 * 파일 삭제 액션
 */
export async function deleteAttachment(fileId: number) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    if (!accessToken) return { success: false, error: "로그인이 필요합니다." };

    const verified = await verify(accessToken);
    if (!verified?.id) return { success: false, error: "유효하지 않은 토큰입니다." };

    const attachment = await query.getAttachmentById(fileId);
    if (!attachment) return { success: false, error: "파일을 찾을 수 없습니다." };
    if (attachment.userId !== verified.id) return { success: false, error: "삭제 권한이 없습니다." };

    // 물리 파일 삭제
    let relativePath = attachment.path.startsWith("/") ? attachment.path.substring(1) : attachment.path;
    const filePath = path.join(process.cwd(), relativePath);

    try { await unlink(filePath); } catch (err: any) {
      if (err.code !== "ENOENT") console.error("FS Unlink Error:", err);
    }

    // DB 삭제
    await query.deleteAttachmentFromDb(fileId);
    return { success: true };
  } catch (error) {
    return { success: false, error: "삭제 실패" };
  }
}

/**
 * 내 파일 목록 조회 액션
 */
export async function getMyFiles(page: number = 1) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) throw new Error("로그인 필요");

  const decoded = decodeJwt(accessToken) as { id: number } | null;
  if (!decoded) throw new Error("잘못된 토큰");

  const pageSize = 10;
  const { items, totalCount } = await query.getUserAttachments(decoded.id, page, pageSize);

  return {
    items,
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize,
    },
  };
}

export async function unlinkAttachment(fileId: number): Promise<ActionState<null>> {
  try {
    // 1. 로그인 및 권한 체크
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    if (!accessToken) return { success: false, type: "error", message: "로그인이 필요합니다." };

    const decoded = decodeJwt(accessToken) as { id: number; isAdmin: boolean } | null;
    if (!decoded) return { success: false, type: "error", message: "유효하지 않은 토큰입니다." };

    // 2. 파일 소유권 확인
    const attachment = await query.findAttachmentForAuth(fileId);
    if (!attachment) return { success: false, type: "error", message: "파일을 찾을 수 없습니다." };

    if (attachment.userId !== decoded.id && !decoded.isAdmin) {
      return { success: false, type: "error", message: "권한이 없습니다." };
    }

    // 3. 연결 해제 실행 (Query 호출)
    await query.updateAttachmentToUnlink(fileId);

    return {
      success: true,
      type: "success",
      message: "목록에서 제외되었습니다."
    };
  } catch (error) {
    console.error("unlinkAttachment 에러:", error);
    return { success: false, type: "error", message: "연결 해제 중 오류가 발생했습니다." };
  }
}

export async function getAttachmentsAction(
  documentId?: number,
  tempId?: string | null
): Promise<ActionState<Attachment[]>> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    const decoded = accessToken ? (decodeJwt(accessToken) as { id: number }) : null;
    const userId = decoded?.id;

    const items = await query.findAttachmentsByTarget({ documentId, tempId, userId });

    return {
      success: true,
      type: "success",
      message: "조회 성공",
      data: items.map(att => ({
        id: att.id,
        uuid: att.uuid,
        name: att.originalName, // DB 필드명과 맞춤
        size: att.size,
        path: att.path,
        mimeType: att.mimeType,
      })),
    };
  } catch (error) {
    console.error("getAttachmentsAction 에러:", error);
    return { success: false, type: "error", message: "목록 조회 실패", data: [] };
  }
}

export async function linkFileToSession(
  fileId: number,
  tempId: string | null,
  documentId: number
): Promise<ActionState<null>> { // 또는 ActionResponse<null>
  try {
    // 🌟 수정 모드라면 즉시 documentId 연결, 새 글이면 tempId 연결
    await query.updateAttachmentLink(fileId, {
      tempId: documentId > 0 ? null : tempId,
      documentId: documentId > 0 ? documentId : null,
    });

    // ✅ 인터페이스 규격에 맞춰 message와 type을 모두 반환합니다.
    return {
      success: true,
      type: "success",
      message: "보관함 파일이 연결되었습니다.",
      data: null
    };
  } catch (error) {
    console.error("linkFileToSession 에러:", error);
    return {
      success: false,
      type: "error",
      message: "파일 연결에 실패했습니다.",
      data: null
    };
  }
}