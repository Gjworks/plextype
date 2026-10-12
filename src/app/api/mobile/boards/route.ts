import { NextRequest, NextResponse } from "next/server";

import { canAccessBoard } from "@/modules/posts/actions/access";
import prisma from "@/core/utils/db/prisma";
import { verify } from "@/core/utils/auth/jwtAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  const accessToken = request.cookies.get("accessToken")?.value;
  const verified = accessToken ? await verify(accessToken) : null;

  if (!verified?.id) {
    return NextResponse.json(
      { success: false, message: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  try {
    const boards = await prisma.modules.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        mid: true,
        moduleName: true,
        moduleDesc: true,
        config: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const visibleBoards: Array<(typeof boards)[number] & {
      documentCount: number; categoryCount: number;
      latestDocument: { id: number; uuid: string | null; slug: string; title: string | null; updatedAt: Date } | null;
    }> = [];
    for (const board of boards) {
      if (!await canAccessBoard(board.id, "list", verified) || !await canAccessBoard(board.id, "read", verified)) continue;
      const ownerOnly = Boolean((board.config as { consultingState?: boolean } | null)?.consultingState);
      const where = { moduleId: board.id, published: true, isSecrets: false,
        ...(ownerOnly && !verified.isAdmin ? { userId: verified.id } : {}) };
      const [documentCount, categoryCount, latestDocument] = await Promise.all([
        prisma.document.count({ where }),
        prisma.category.count({ where: { moduleId: board.id } }),
        prisma.document.findFirst({ where, orderBy: { updatedAt: "desc" }, select: { id: true, uuid: true, slug: true, title: true, updatedAt: true } }),
      ]);
      visibleBoards.push({ ...board, documentCount, categoryCount, latestDocument });
    }
    return NextResponse.json(
      {
        success: true,
        data: visibleBoards,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Mobile Boards API Error]", error);
    return NextResponse.json(
      { success: false, message: "게시판 목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
