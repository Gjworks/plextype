import prisma from "@utils/db/prisma";

export const findRecentAttachmentsAdminQuery = async (
  page: number,
  pageSize: number,
) => {
  const [items, totalCount] = await Promise.all([
    prisma.attachment.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        uuid: true,
        fileName: true,
        originalName: true,
        mimeType: true,
        size: true,
        path: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        uploadedBy: {
          select: {
            id: true,
            nickName: true,
            accountId: true,
            profile: {
              select: {
                profileImage: true,
              },
            },
          },
        },
      },
    }),
    prisma.attachment.count(),
  ]);

  return { items, totalCount };
};

export const findAttachmentDeleteTargetAdminQuery = async (id: number) => {
  return prisma.attachment.findUnique({
    where: { id },
    select: {
      id: true,
      originalName: true,
      fileName: true,
      path: true,
      userId: true,
      mimeType: true,
    },
  });
};
