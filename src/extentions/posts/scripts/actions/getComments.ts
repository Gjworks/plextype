
import prisma from "@plextype/utils/db/prisma";

export interface CommentWithChildren {
  id: number;
  uuid: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  documentId: number;
  userId: number | null;
  userName?: string | null;
  depth: number;
  parentId?: number | null;
  children?: CommentWithChildren[];
  isDeleted?: boolean;
}

export async function getComments(
  documentId: number,
  page = 1,
  pageSize = 10
): Promise<{
  items: CommentWithChildren[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}> {
  // 1. DB에서 전체 댓글 가져오기
  const allComments = await prisma.comment.findMany({
    where: { documentId },
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });

  // 2. 전체 댓글 map으로 변환
  const map = new Map<number, CommentWithChildren>();
  allComments.forEach(c => {
    map.set(c.id, {
      id: c.id,
      uuid: c.uuid,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      documentId: c.documentId,
      userId: c.userId,
      userName: c.user?.nickName ?? null,
      depth: c.depth,
      parentId: c.parentId ?? null,
      isDeleted: c.isDeleted,
      children: [],
    });
  });

  // 3. 부모-자식 관계 연결
  map.forEach(comment => {
    if (comment.parentId && map.has(comment.parentId)) {
      map.get(comment.parentId)!.children!.push(comment);
    }
  });

  // 4. 전체 flatten 리스트 만들기 (루트부터 순회)
  const roots = Array.from(map.values()).filter(c => !c.parentId);
  const flatten: CommentWithChildren[] = [];
  const traverse = (comments: CommentWithChildren[]) => {
    comments.forEach(c => {
      flatten.push(c);
      if (c.children && c.children.length > 0) traverse(c.children);
    });
  };
  traverse(roots);

  // 5. flatten 리스트 기준 slice
  const totalCount = flatten.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const start = (page - 1) * pageSize;
  const end = page * pageSize;
  const pageItems = flatten.slice(start, end);

  // 6. slice된 댓글만 다시 트리로 재구성
  const pageMap = new Map<number, CommentWithChildren>();
  const pageRoots: CommentWithChildren[] = [];
  pageItems.forEach(c => {
    pageMap.set(c.id, { ...c, children: [] });
  });

  pageItems.forEach(c => {
    if (c.parentId && pageMap.has(c.parentId)) {
      pageMap.get(c.parentId)!.children!.push(pageMap.get(c.id)!);
    } else {
      pageRoots.push(pageMap.get(c.id)!);
    }
  });

  return {
    items: pageRoots,
    pagination: { totalCount, totalPages, currentPage: page, pageSize },
  };
}


export async function getParentCommentPage(documentId: number, parentId: number, pageSize = 10): Promise<number> {
  // parentId 댓글이 속한 루트 댓글 순번 기반 페이지 계산
  // 루트 댓글 기준
  const parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
  if (!parentComment) return 1;

  if (!parentComment.parentId) {
    // 루트 댓글이면 마지막 페이지
    const count = await prisma.comment.count({ where: { documentId, parentId: null, id: { lte: parentComment.id } } });
    return Math.ceil(count / pageSize);
  } else {
    // 대댓글이면 부모 댓글 기준으로
    const parentRoot = await prisma.comment.findUnique({ where: { id: parentComment.parentId } });
    if (!parentRoot) return 1;
    const count = await prisma.comment.count({ where: { documentId, parentId: null, id: { lte: parentRoot.id } } });
    return Math.ceil(count / pageSize);
  }
}