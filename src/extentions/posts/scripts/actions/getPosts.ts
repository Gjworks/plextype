import prisma from "@plextype/utils/db/prisma";


export async function getPosts(pid: string, page: number = 1, pageSize: number = 10) {
  const posts = await prisma.posts.findUnique({
    where: { pid },
    select: { id: true },
  });

  if (!posts) {
    return { items: [], pagination: { totalCount: 0, totalPages: 0, currentPage: 1, pageSize } };
  }

  const totalCount = await prisma.document.count({
    where: {
      resourceType: "post",
      resourceId: posts.id,
    },
  });

  const documents = await prisma.document.findMany({
    where: {
      resourceType: "post",
      resourceId: posts.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      isNotice: true,
      isSecrets: true,
      readCount: true,
      commentCount: true,
      voteCount: true,
      user: {
        select: {
          id: true,
          nickName: true,
        },
      },
    },
  });

  return {
    items: documents.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize,
    },
  };
}


export async function getDocument(id: string) {
  const document = await prisma.document.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      isNotice: true,
      isSecrets: true,
      readCount: true,
      commentCount: true,
      voteCount: true,
      user: {
        select: {
          id: true,
          nickName: true,
        },
      },
    },
  });

  if (!document) {
    return [];
  }
  return document;
}
