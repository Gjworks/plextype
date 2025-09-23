import prisma from "@plextype/utils/db/prisma";

export async function getUniqueCommentMember(documentId: number) {
  // userId가 있는 댓글만 가져오기
  const comments = await prisma.comment.findMany({
    where: {
      documentId,
      userId: { not: null },
      isDeleted: false,
    },
    select: {
      userId: true,
      user: {
        select: {
          id: true,
          nickName: true,
          // 필요하면 더 추가: name, profile 등
        },
      },
    },
  });

  // userId 기준으로 중복 제거
  const uniqueMap = new Map<number, typeof comments[0]>();
  comments.forEach(c => {
    if (c.userId && !uniqueMap.has(c.userId)) {
      uniqueMap.set(c.userId, c);
    }
  });

  // 중복 제거된 회원 배열
  const participants = Array.from(uniqueMap.values()).map(c => c.user);

  return participants; // User[] 형태
}