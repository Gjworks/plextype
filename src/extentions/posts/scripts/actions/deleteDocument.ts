"use server";

import prisma from "@plextype/utils/db/prisma";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";

export async function deleteDocument(documentId: number, pid: string) {
  // 1. 로그인 체크
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) throw new Error("로그인이 필요합니다.");

  const decoded = decodeJwt(accessToken) as { id: number; isAdmin: boolean } | null;
  if (!decoded) throw new Error("유효하지 않은 토큰입니다.");

  const userId = decoded.id;
  const isAdmin = decoded.isAdmin;

  // 2. 문서 조회
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, userId: true },
  });
  if (!document) throw new Error("존재하지 않는 글입니다.");

  // 3. 작성자 확인
  if (document.userId !== userId && !isAdmin) {
    throw new Error("본인이 작성한 글만 삭제할 수 있습니다.");
  }

  // 4. 삭제
  await prisma.document.delete({ where: { id: documentId } });

  // 5. 삭제 후 리턴 (클라이언트에서 redirect 처리)
  return { success: true, pid };
}