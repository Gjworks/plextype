import prisma, { Prisma } from "@plextype/utils/db/prisma";


export async function getPosts(pid: string, page: number = 1, pageSize: number = 10, categoryId?: string) {
  // 1. 게시판 조회
  const posts = await prisma.posts.findUnique({
    where: { pid },
    select: { id: true },
  });

  if (!posts) {
    return { items: [], pagination: { totalCount: 0, totalPages: 0, currentPage: 1, pageSize } };
  }

  const whereCondition: Prisma.DocumentWhereInput = {
    resourceType: "post",
    resourceId: posts.id,
  };

  if (categoryId && categoryId !== "0") {
    whereCondition.categoryId = Number(categoryId);
  }

  const totalCount = await prisma.document.count({ where: whereCondition });

  // 2. 게시물 및 첨부파일 조회
  const documents = await prisma.document.findMany({
    where: whereCondition,
    orderBy: { createdAt: "desc" },
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
      // ✅ Attachment 테이블에서 이미지만 1개 가져오기
      // 스키마에 관계가 설정되어 있지 않다면 Prisma가 에러를 낼 수 있으므로
      // 아래 include/select 사용 전 Document 모델에 'attachments Attachment[]'가 있는지 확인하세요.
      attachments: {
        where: {
          mimeType: { startsWith: 'image/' }
        },
        take: 1,
        select: {
          path: true
        }
      },
      category: { select: { id: true, title: true, parentId: true } },
      user: { select: { id: true, nickName: true } },
    },
  });

  // 3. 썸네일 결정 로직
  const items = documents.map((doc) => {
    let previewContent = "";
    let thumbnail: string | null = null;

    // A. 본문 내용 파싱 (EditorJS 블록 체크)
    if (doc.content) {
      try {
        let rawContent = doc.content;

        // 1. 문자열 앞뒤 따옴표 제거 (필요한 경우)
        if (rawContent.startsWith('"') && rawContent.endsWith('"')) {
          rawContent = rawContent.slice(1, -1);
        }

        const parsed = JSON.parse(rawContent);

        // ✅ Tiptap 데이터 구조인 경우 (type: "doc")
        if (parsed.type === "doc" && Array.isArray(parsed.content)) {

          // --- A. 썸네일 추출 (첫 번째 이미지 노드 찾기) ---
          const findFirstImage = (nodes: any[]): string | null => {
            for (const node of nodes) {
              // 직접 이미지 노드인 경우
              if (node.type === 'image' && node.attrs?.src) return node.attrs.src;
              // 자식 노드가 있는 경우 (표 내부나 인용구 내부 등 재귀 탐색)
              if (node.content) {
                const nested = findFirstImage(node.content);
                if (nested) return nested;
              }
            }
            return null;
          };
          thumbnail = findFirstImage(parsed.content) || "";

          // --- B. 프리뷰 텍스트 추출 (모든 텍스트 노드 합치기) ---
          const extractText = (nodes: any[]): string => {
            let text = "";
            nodes.forEach(node => {
              if (node.type === "text" && node.text) {
                text += node.text;
              } else if (node.content) {
                text += extractText(node.content) + " ";
              }
            });
            return text;
          };

          const fullText = extractText(parsed.content);
          // 약 150자 정도로 자르고 공백 정리
          previewContent = fullText.length > 150
            ? fullText.slice(0, 150).trim() + "..."
            : fullText.trim();

        }
        // ✅ (하위 호환성) 만약 기존 EditorJS 데이터인 경우
        else if (parsed.blocks) {
          const imageBlock = parsed.blocks.find((block: any) => block.type === 'image');
          if (imageBlock && imageBlock.data?.file?.url) {
            thumbnail = imageBlock.data.file.url;
          }
          const textBlocks = parsed.blocks.slice(0, 3).map((b: any) =>
            (b.data?.text || "").replace(/<[^>]+>/g, "")
          );
          previewContent = textBlocks.join(" ");
        }
      } catch (e) {
        // JSON 파싱 실패 시 일반 텍스트로 처리
        previewContent = doc.content.replace(/<[^>]+>/g, "").slice(0, 150);
      }
    }

    // B. ✅ 본문에 이미지가 없으면 첨부파일(Attachment)의 path 사용
    if (!thumbnail && doc.attachments && doc.attachments.length > 0) {
      thumbnail = doc.attachments[0].path;
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
      categoryId: true,
      userId: true,
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
