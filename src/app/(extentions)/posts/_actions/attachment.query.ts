// src/app/(extentions)/posts/_actions/attachment.query.ts
import prisma from "@utils/db/prisma";

// 1. 임시 파일 소유권 이전 및 상태 업데이트
export async function updateAttachmentOwnership(tempId: string, newDocumentId: number, resourceType: string) {
  return prisma.attachment.updateMany({
    where: {tempId, documentId: null},
    data: {
      resourceType,
      documentId: newDocumentId,
      tempId: null,
    },
  });
}

// 2. DB 내 경로 문자열 일괄 치환 (Raw Query)
export async function updateAttachmentPathStrings(documentId: number, resourceType: string, oldPrefix: string, newPrefix: string) {
  return prisma.$executeRaw`
      UPDATE "Attachment"
      SET "path" = REPLACE("path", ${oldPrefix}, ${newPrefix})
      WHERE "documentId" = ${documentId}
        AND "resourceType" = ${resourceType}
  `;
}

// 3. 게시글 본문 조회 및 업데이트
export async function getDocumentContent(id: number) {
  return prisma.document.findUnique({
    where: {id},
    select: {content: true},
  });
}

export async function updateDocumentContent(id: number, content: string) {
  return prisma.document.update({
    where: {id},
    data: {content},
  });
}

// 4. 단일 첨부파일 정보 조회
export async function getAttachmentById(id: number) {
  return prisma.attachment.findUnique({
    where: {id},
  });
}

// 5. 첨부파일 DB 삭제
export async function deleteAttachmentFromDb(id: number) {
  return prisma.attachment.delete({
    where: {id},
  });
}

// 6. 내 파일 목록 조회 (페이징 포함)
export async function getUserAttachments(userId: number, page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;

  const [totalCount, items] = await Promise.all([
    prisma.attachment.count({ where: { userId } }),
    prisma.attachment.findMany({
      where: { userId, tempId: null },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        fileName: true,
        originalName: true,
        mimeType: true,
        size: true,
        path: true,
      },
    }),
  ]);

  return { items, totalCount };
}

/**
 * 첨부파일의 연결 정보를 초기화 (연결 해제)
 */
export async function updateAttachmentToUnlink(id: number) {
  return prisma.attachment.update({
    where: { id },
    data: {
      documentId: null,
      tempId: null,
    },
  });
}

/**
 * 권한 체크를 위한 파일 정보 조회
 */
export async function findAttachmentForAuth(id: number) {
  return prisma.attachment.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
}

export async function findAttachmentsByTarget(params: {
  documentId?: number;
  tempId?: string | null;
  userId?: number;
}) {
  return prisma.attachment.findMany({
    where: {
      OR: [
        params.documentId ? { documentId: params.documentId } : {},
        (params.tempId && params.userId)
          ? { tempId: params.tempId, userId: params.userId, documentId: null }
          : {},
      ],
    },
    orderBy: { createdAt: "asc" },
  });
}


export async function linkAttachmentsToDocument(tempId: string, documentId: number) {
  return prisma.attachment.updateMany({
    where: {
      tempId: tempId,
      documentId: null // 아직 연결되지 않은 파일들만 대상
    },
    data: {
      documentId: documentId,
      tempId: null // 연결이 완료되었으므로 tempId는 비워줍니다 (선택 사항)
    }
  });
}

export async function updateAttachmentLink(id: number, data: { tempId?: string | null; documentId?: number | null }) {
  return prisma.attachment.update({
    where: { id },
    data: data,
  });
}