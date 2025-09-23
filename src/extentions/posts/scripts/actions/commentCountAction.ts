import prisma from "@plextype/utils/db/prisma";

// commentCount만 1 증가
export async function addCommentAndIncrementCount(documentId: number) {
  return await prisma.document.update({
    where: { id: documentId },
    data: { commentCount: { increment: 1 } },
  });
}

// commentCount만 1 감소
export async function deleteCommentAndDecrementCount(documentId: number) {
  if (!documentId) throw new Error("Document ID is required");

  return await prisma.$transaction(async (tx) => {
    // 1. 현재 commentCount 조회
    const doc = await tx.document.findUnique({
      where: { id: documentId },
      select: { commentCount: true },
    });

    if (!doc) {
      console.warn(`Document with ID ${documentId} not found.`);
      return null;
    }

    // 2. commentCount 감소, 0 미만 방지
    const newCount = Math.max((doc.commentCount || 0) - 1, 0);

    const updated = await tx.document.update({
      where: { id: documentId },
      data: { commentCount: newCount },
    });

    return updated;
  });
}