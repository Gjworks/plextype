import prisma from "@plextype/utils/db/prisma";
import path from "path";
import { rename, mkdir } from "fs/promises";

/**
 * 임시 파일(tempId)을 실제 리소스(resourceId)에 연결하고, 파일 시스템에서 디렉토리를 이동합니다.
 * 이 함수는 게시글, 상품 등 새로운 리소스가 DB에 생성된 직후에 호출되어야 합니다.
 *
 * @param tempId 클라이언트로부터 받은 임시 파일 식별자 (예: 'a1b2c3d4-...')
 * @param newResourceId 새로 생성된 리소스의 ID (예: 새 게시글 ID)
 * @param finalResourceType 리소스 유형 (예: "posts", "shop", "user")
 */
export async function commitAttachments(
  tempId: string,
  newResourceId: number,
  finalResourceType: string,
): Promise<void> {
  console.log(`[Attachment Commit] Starting commitment for tempId: ${tempId} to Resource: ${finalResourceType}/${newResourceId}`);

  // DB에 임시 파일로 기록될 때 resourceType은 "temp"로 저장되었습니다.
  const tempResourceType = "temp";

  // 1. DB 업데이트 (Attachment 레코드 연결)
  try {
    // 이 부분은 Prisma Client API를 사용하므로 문제 없이 잘 작동합니다.
    const updateResult = await prisma.attachment.updateMany({
      where: {
        tempId: tempId,
        resourceType: tempResourceType, // 임시 파일로 저장된 레코드 필터링
        resourceId: 0,                   // resourceId가 0인 레코드 필터링
      },
      data: {
        resourceType: finalResourceType, // 'posts' 등으로 변경
        resourceId: newResourceId,      // 새로 생성된 ID로 변경
        tempId: null,                   // 임시 ID 제거 (커밋 완료)
      },
    });

    if (updateResult.count === 0) {
      console.log(`[Attachment Commit] No attachments found for tempId: ${tempId}. No action needed.`);
      return;
    }

    console.log(`[Attachment Commit] DB updated: ${updateResult.count} attachments committed.`);

    // 2. 파일 시스템에서 디렉토리 이동
    const oldDirIdentifier = tempId;
    const newDirIdentifier = String(newResourceId);

    // 이전 경로: {프로젝트_루트}/public/uploads/temp/{tempId}
    const oldPath = path.join(
      process.cwd(),
      "public",
      "uploads",
      tempResourceType, // "temp"
      oldDirIdentifier
    );

    // 새 경로: {프로젝트_루트}/public/uploads/{finalResourceType}/{newResourceId}
    const newPath = path.join(
      process.cwd(),
      "public",
      "uploads",
      finalResourceType,
      newDirIdentifier
    );

    // 새 DB 경로 접두사 (Raw 쿼리에서 사용할 경로)
    const oldDbPathPrefix = `/uploads/${tempResourceType}/${oldDirIdentifier}`;
    const newDbPathPrefix = `/uploads/${finalResourceType}/${newDirIdentifier}`;

    try {
      // 2-1. 대상 디렉토리 (newPath)가 없으면 생성 (rename 전 필수)
      await mkdir(newPath, { recursive: true });

      // 2-2. public/uploads/temp/{tempId} 폴더를 public/uploads/posts/{newPostId}로 이동
      await rename(oldPath, newPath);
      console.log(`[Attachment Commit] Directory moved from ${oldPath} to ${newPath}`);

      // 3. 파일 경로 (path 필드) 일괄 업데이트 - REPLACE SQL 사용 (첫 번째 Raw 쿼리 수정)
      await prisma.$executeRaw`
            UPDATE "Attachment"
            SET "path" = REPLACE("path", 
                               ${oldDbPathPrefix}::text, 
                               ${newDbPathPrefix}::text)
            WHERE "resourceId" = ${newResourceId}::int
              AND "resourceType" = ${finalResourceType}::text;
        `;

      console.log(`[Attachment Commit] DB path fields updated from ${oldDbPathPrefix} to ${newDbPathPrefix}.`);

    } catch (fileError: any) {
      // ENOENT 처리 로직 (임시 폴더가 없었을 때)
      if (fileError.code !== 'ENOENT') {
        console.error(`[Attachment Commit] Fatal Error moving directory ${oldPath}:`, fileError);
        // Raw 쿼리 실패 코드가 파일 시스템 에러로 잡히는 경우가 있으므로 P2010 오류를 방지합니다.
        // 파일 시스템 이동 자체의 심각한 오류만 throw 합니다.
        throw new Error(`파일 시스템 이동 실패: ${fileError.message}`);
      }

      // ENOENT의 경우, 파일은 없었지만 1단계 DB 업데이트가 완료되었을 수 있으므로
      // Raw 쿼리를 한 번 더 실행하여 path 업데이트를 시도합니다. (두 번째 Raw 쿼리 수정)
      if (updateResult.count > 0) {
        await prisma.$executeRaw`
            UPDATE "Attachment"
            SET "path" = REPLACE("path", ${oldDbPathPrefix}::text, ${newDbPathPrefix}::text)
            WHERE "resourceId" = ${newResourceId}::int
    AND "resourceType" = ${finalResourceType}::text;
        `;
        console.log(`[Attachment Commit] DB path fields updated despite no physical directory move (ENOENT).`);
      }
    }

  } catch (dbError) {
    // P2010 Raw 쿼리 실패도 여기서 잡히므로, 에러 로깅을 명확히 합니다.
    console.error("[Attachment Commit] Failed to execute commit logic:", dbError);
    // DB 업데이트만 실패했더라도 오류를 던져 게시글 저장 트랜잭션 전체를 롤백하도록 유도
    throw new Error("파일 커밋 중 데이터베이스 업데이트 실패");
  }
}