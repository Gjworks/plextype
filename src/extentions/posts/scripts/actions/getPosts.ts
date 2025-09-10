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

  // ✅ EditorJS content 일부만 추출 (첫 2~3 블록)
  const items = documents.map((doc) => {
    let previewContent = "";
    if (doc.content) { // null 체크
      try {
        const parsed = JSON.parse(doc.content);
        const slicedBlocks = parsed.blocks?.slice(0, 3) || [];
        // previewContent = JSON.stringify({ ...parsed, blocks: slicedBlocks });
        const textBlocks = slicedBlocks.map((b: any) => {
          const rawText = b.data?.text || "";
          return rawText.replace(/<[^>]+>/g, ""); // 모든 HTML 태그 제거
        });

        previewContent = textBlocks.join(" "); // 공백으로 연결
      } catch {
        // JSON 파싱 실패하면 그냥 원래 문자열 넣기
        previewContent = doc.content;
      }
    }


    return {
      ...doc,
      content: previewContent,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  });

  return {
    items,
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
