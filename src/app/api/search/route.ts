import { NextRequest, NextResponse } from "next/server";

import { runIntegratedSearch } from "@/core/search/runSearch";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "all";
  const limit = Number(searchParams.get("limit") || 6);

  try {
    const data = await runIntegratedSearch({
      query,
      type,
      limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 12) : 6,
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("[Integrated Search API Error]", error);
    return NextResponse.json(
      { success: false, message: "검색 결과를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
