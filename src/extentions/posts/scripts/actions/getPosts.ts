import prisma, { Prisma } from "@plextype/utils/db/prisma";


export async function getPosts(pid: string, page: number = 1, pageSize: number = 10, categoryId?: string) {
  // 1. 게시판 ID(pid)로 posts 테이블에서 id 찾기
  const posts = await prisma.posts.findUnique({
    where: { pid },
    select: { id: true },
  });

  if (!posts) {
    return { items: [], pagination: { totalCount: 0, totalPages: 0, currentPage: 1, pageSize } };
  }

  // 2. ✅ 검색 조건(Where)을 동적으로 생성
  // 기본 조건: 해당 게시판(posts.id)에 속한 'post' 타입의 문서
  const whereCondition: Prisma.DocumentWhereInput = {
    resourceType: "post",
    resourceId: posts.id,
  };

  // ✅ 카테고리 ID가 있고, "0"(전체)이 아닐 경우 필터 추가
  if (categoryId && categoryId !== "0") {
    whereCondition.categoryId = Number(categoryId);
  }

  // 3. 조건에 맞는 게시물 총 개수 계산 (페이지네이션용)
  const totalCount = await prisma.document.count({
    where: whereCondition, // ✅ 수정된 조건 적용
  });

  // 4. 조건에 맞는 게시물 조회
  const documents = await prisma.document.findMany({
    where: whereCondition, // ✅ 수정된 조건 적용
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
      category: {
        select: {
          id: true,
          title: true,
          parentId: true,
        },
      },
      user: {
        select: {
          id: true,
          nickName: true,
        },
      },
    },
  });

  // EditorJS content 파싱 로직 (기존과 동일)
  const items = documents.map((doc) => {
    let previewContent = "";
    let thumbnail: string | null = null;

    if (doc.content) {
      try {
        const parsed = JSON.parse(doc.content);

        if (parsed.blocks && Array.isArray(parsed.blocks)) {
          const imageBlock = parsed.blocks.find((block: any) => block.type === 'image');
          if (imageBlock && imageBlock.data?.file?.url) {
            thumbnail = imageBlock.data.file.url;
          }
        }

        const slicedBlocks = parsed.blocks?.slice(0, 3) || [];
        const textBlocks = slicedBlocks.map((b: any) => {
          const rawText = b.data?.text || "";
          return rawText.replace(/<[^>]+>/g, "");
        });

        previewContent = textBlocks.join(" ");
      } catch {
        previewContent = doc.content;
      }
    }

    return {
      ...doc,
      content: previewContent,
      thumbnail,
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


export async function getDocument(id: number) {
  const document = await prisma.document.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      categoryId:true,
      userId:true,
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
      category: {      // ← 카테고리 정보 추가
        select: {
          id: true,
          title: true,
          desc: true,
          color: true,
          parentId: true,
        },
      },
    },
  });

  if (!document) {
    return [];
  }
  return document;
}
