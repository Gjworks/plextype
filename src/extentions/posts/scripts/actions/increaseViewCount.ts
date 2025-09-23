import prisma from "@plextype/utils/db/prisma";
import dayjs from "dayjs";

export async function increaseViewCount(documentId: number, userId?: number, ip?: string) {
  const oneHourAgo = dayjs().subtract(1, "hour").toDate();

  const exists = await prisma.documentViewLog.findFirst({
    where: {
      documentId,
      OR: [
        userId ? { userId } : {},
        !userId && ip ? { ipAddress: ip } : {},
      ],
      viewedAt: { gte: oneHourAgo },
    },
  });

  if (!exists) {
    await prisma.$transaction([
      prisma.document.update({
        where: { id: documentId },
        data: { readCount: { increment: 1 } },
      }),
      prisma.documentViewLog.create({
        data: { documentId, userId, ipAddress: ip },
      }),
    ]);
  }
}