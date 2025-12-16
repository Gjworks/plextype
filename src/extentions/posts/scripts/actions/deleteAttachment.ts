"use server";

import prisma from "@plextype/utils/db/prisma"; // 프리즈마 경로 수정 필요
import path from "path";
import fs from "fs/promises";
import { verify } from "@plextype/utils/auth/jwtAuth"; // 인증 함수 경로 수정 필요
import { cookies } from "next/headers";

export async function deleteAttachment(fileId: number) {
  try {
    // 1. 인증 확인 (본인 파일만 삭제 가능하도록)
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    if (!accessToken) throw new Error("로그인이 필요합니다.");

    const verified = await verify(accessToken);
    if (!verified || !verified.id) throw new Error("유효하지 않은 토큰입니다.");
    const currentUserId = verified.id;

    // 2. 파일 정보 조회
    const attachment = await prisma.attachment.findUnique({
      where: { id: fileId },
    });

    if (!attachment) {
      return { success: false, error: "파일을 찾을 수 없습니다." };
    }

    // 3. 권한 확인 (작성자 본인인지)
    if (attachment.userId !== currentUserId) {
      return { success: false, error: "삭제 권한이 없습니다." };
    }

    // 4. 물리 파일 삭제
    // DB에 저장된 path 예시: "/files/uploads/posts/2025/12/16/99/uuid.jpg"
    // 실제 물리 경로 조합 로직 (프로젝트 설정에 따라 다를 수 있음)
    let relativePath = attachment.path;

    // 혹시 DB 경로가 웹 URL(/)로 시작한다면 제거
    if (relativePath.startsWith("/")) {
      relativePath = relativePath.substring(1);
    }

    const filePath = path.join(process.cwd(), relativePath);

    try {
      await fs.unlink(filePath);
      console.log("🗑️ 물리 파일 삭제 완료:", filePath);
    } catch (err: any) {
      // 파일이 이미 없더라도 DB 삭제는 진행 (ENOENT)
      if (err.code !== "ENOENT") {
        console.error("파일 삭제 중 오류:", err);
      }
    }

    // 5. DB 데이터 삭제
    await prisma.attachment.delete({
      where: { id: fileId },
    });

    return { success: true };

  } catch (error) {
    console.error("Delete Action Error:", error);
    return { success: false, error: "삭제 실패" };
  }
}