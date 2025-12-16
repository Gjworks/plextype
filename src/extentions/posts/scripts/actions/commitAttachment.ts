import prisma from "@plextype/utils/db/prisma";
import path from "path";
import { rename, mkdir, rmdir } from "fs/promises";

/**
 * 임시 파일(tempId)을 실제 리소스(resourceId)에 연결하고, 파일 시스템에서 디렉토리를 이동합니다.
 * 날짜 기반 폴더링 (YYYY/MM/DD)을 적용하여 이동합니다.
 */
export async function commitAttachments(
  tempId: string,
  newDocumentId: number,
  finalResourceType: string = "posts",
): Promise<void> {
  console.log(`[Commit] 시작: tempId(${tempId}) -> ${finalResourceType}/${newDocumentId}`);

  // 1. 날짜 정보 생성 (오늘 날짜 기준)
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');

  try {
    // =================================================================
    // 1. DB 메타데이터 업데이트 (소유권 이전)
    // =================================================================
    // tempId를 가진 파일들을 찾아서 documentId와 resourceType을 갱신합니다.
    const updateResult = await prisma.attachment.updateMany({
      where: {
        tempId: tempId,
        documentId: 0,
      },
      data: {
        resourceType: finalResourceType,
        documentId: newDocumentId,
        tempId: null, // 임시 상태 해제
      },
    });

    if (updateResult.count === 0) {
      console.log(`[Commit] 이동할 파일이 없습니다. (tempId: ${tempId})`);
      // 파일이 없더라도 로직 종료 (에러 아님)
      return;
    }

    console.log(`[Commit] DB ${updateResult.count}개 파일 소유권 이전 완료`);

    // =================================================================
    // 2. 경로 변수 정의
    // =================================================================

    // [물리적 경로]
    // Old: 프로젝트루트/files/temp/{tempId}
    const oldDir = path.join(process.cwd(), "files", "temp", tempId);

    // New Base: 프로젝트루트/files/uploads/{resourceType}/{Year}/{Month}/{Day}
    const newBaseDir = path.join(process.cwd(), "files", "uploads", finalResourceType, year, month, day);
    // New Final: .../{documentId}
    const newDir = path.join(newBaseDir, String(newDocumentId));

    // [DB/웹 URL 경로] (슬래시 / 강제 사용)
    // Old: /files/temp/{tempId}
    const oldDbPrefix = `/files/temp/${tempId}`;
    // New: /files/uploads/{resourceType}/{Year}/{Month}/{Day}/{documentId}
    const newDbPrefix = `/files/uploads/${finalResourceType}/${year}/${month}/${day}/${newDocumentId}`;


    // =================================================================
    // 3. 파일 시스템 이동 (폴더 Rename)
    // =================================================================
    try {
      // 3-1. 목표 경로의 상위 폴더(날짜 폴더)가 없으면 생성
      await mkdir(newBaseDir, { recursive: true });

      // 3-2. 폴더 통째로 이동 (files/temp/abc -> files/uploads/.../99)
      await rename(oldDir, newDir);
      console.log(`[Commit] 폴더 이동 완료: ${oldDir} -> ${newDir}`);

    } catch (fsError: any) {
      // ENOENT: 소스 폴더(oldDir)가 없는 경우.
      // DB에는 기록이 있는데 실제 폴더가 없는 경우(삭제됨 등)일 수 있으므로
      // 치명적 에러로 처리하지 않고 DB 경로 업데이트 단계로 넘어갑니다.
      if (fsError.code !== 'ENOENT') {
        console.error(`[Commit] 폴더 이동 중 치명적 에러:`, fsError);
        throw fsError;
      }
      console.warn(`[Commit] 주의: 실제 임시 폴더가 존재하지 않습니다. (ENOENT)`);
    }

    // =================================================================
    // 4. DB 경로 문자열 일괄 치환 (SQL Raw Query)
    // =================================================================
    // Prisma Client로는 문자열 부분 치환(REPLACE)이 안되므로 Raw Query 사용
    // Attachment 테이블의 path 컬럼에서 oldDbPrefix를 newDbPrefix로 교체

    const affectedCount = await prisma.$executeRaw`
      UPDATE "Attachment"
      SET "path" = REPLACE("path", ${oldDbPrefix}, ${newDbPrefix})
      WHERE "documentId" = ${newDocumentId}
        AND "resourceType" = ${finalResourceType}
    `;

    console.log(`[Commit] DB 경로 문자열 업데이트 완료 (${affectedCount}건)`);


    // =================================================================
    // 5. 게시글 본문(Content) 내 이미지 태그 경로 치환
    // =================================================================
    const post = await prisma.document.findUnique({
      where: { id: newDocumentId },
      select: { content: true },
    });

    if (post?.content) {
      // 본문 HTML 안에 있는 "/files/temp/..." 문자열을 모두 새 경로로 변경
      const updatedContent = post.content.replaceAll(oldDbPrefix, newDbPrefix);

      // 변경사항이 있을 때만 업데이트
      if (post.content !== updatedContent) {
        await prisma.document.update({
          where: { id: newDocumentId },
          data: { content: updatedContent },
        });
        console.log("[Commit] 게시글 본문(HTML) 이미지 경로 업데이트 완료");
      }
    }

    // (선택사항) 혹시 남아있을지 모를 빈 temp 폴더 정리 시도
    // rename으로 이동했으면 원본은 사라지지만, 에러 등으로 남았을 경우 대비
    try {
      await rmdir(oldDir);
    } catch (e) { /* 무시 */ }

  } catch (error) {
    console.error("[Commit] 파일 커밋 중 오류 발생:", error);
    // 여기서 에러를 throw하면 게시글 저장 자체가 실패 처리될 수 있습니다.
    // 비즈니스 로직에 따라 throw 할지 말지 결정하세요.
    // throw error;
  }
}