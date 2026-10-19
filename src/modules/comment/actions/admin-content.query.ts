import prisma from "@utils/db/prisma";

export const findRecentCommentsAdminQuery = async (
  page: number,
  pageSize: number,
) => {
  const [items, totalCount] = await Promise.all([
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        uuid: true,
        slug: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        isDeleted: true,
        isSecret: true,
        status: true,
        depth: true,
        parentId: true,
        user: {
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
        document: {
          select: {
            id: true,
            slug: true,
            title: true,
            module: {
              select: {
                id: true,
                mid: true,
                moduleName: true,
              },
            },
          },
        },
      },
    }),
    prisma.comment.count(),
  ]);

  return { items, totalCount };
};

export const findCommentDeleteTargetAdminQuery = async (id: number) => {
  return prisma.comment.findUnique({
    where: { id },
    select: {
      id: true,
      content: true,
      userId: true,
      documentId: true,
      document: {
        select: {
          slug: true,
          title: true,
          module: {
            select: {
              mid: true,
              moduleName: true,
            },
          },
        },
      },
    },
  });
};
