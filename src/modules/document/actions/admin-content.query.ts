import prisma from "@utils/db/prisma";

export const findRecentDocumentsAdminQuery = async (
  page: number,
  pageSize: number,
) => {
  const where = {
    moduleType: "posts",
  };

  const [items, totalCount] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        status: true,
        published: true,
        isNotice: true,
        isSecrets: true,
        readCount: true,
        commentCount: true,
        createdAt: true,
        updatedAt: true,
        module: {
          select: {
            id: true,
            mid: true,
            moduleName: true,
          },
        },
        category: {
          select: {
            id: true,
            title: true,
          },
        },
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
      },
    }),
    prisma.document.count({ where }),
  ]);

  return { items, totalCount };
};

export const findDocumentDeleteTargetAdminQuery = async (id: number) => {
  return prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      userId: true,
      module: {
        select: {
          mid: true,
          moduleName: true,
        },
      },
    },
  });
};
