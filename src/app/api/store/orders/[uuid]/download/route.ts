import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import mime from "mime-types";
import path from "path";

import { refreshVerify, verify } from "@/core/utils/auth/jwtAuth";
import * as query from "@/extensions/store/actions/market.query";

export const runtime = "nodejs";

const getSessionUserId = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;
  const verified = accessToken ? await verify(accessToken) : null;
  const refreshVerified = !verified?.id && refreshToken ? await refreshVerify(refreshToken) : null;
  const userId = verified?.id || refreshVerified?.id;

  return userId ? Number(userId) : null;
};

const normalizeStoreFilePath = (filePath: string) => {
  const normalized = filePath.replace(/^\/api\/storage\/uploads\//, "/storage/uploads/");
  return decodeURIComponent(normalized.replace(/^\/storage\/uploads\//, ""));
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ uuid: string }> }) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { uuid } = await params;
    const order = await query.findMyStorePurchaseByOrderUuid(uuid, userId);
    if (!order) {
      return NextResponse.json({ error: "구매 내역을 찾을 수 없습니다." }, { status: 404 });
    }

    if (order.orderStatus !== "paid" && order.orderStatus !== "completed") {
      return NextResponse.json({ error: "다운로드 권한이 없습니다." }, { status: 403 });
    }

    if (order.latestDeliveryType !== "file" || !order.latestFilePath) {
      return NextResponse.json({ error: "다운로드 파일이 없습니다." }, { status: 404 });
    }

    const relativePath = normalizeStoreFilePath(order.latestFilePath);
    if (!relativePath || relativePath.includes("\0") || path.isAbsolute(relativePath)) {
      return NextResponse.json({ error: "유효하지 않은 파일 경로입니다." }, { status: 400 });
    }

    const uploadsRoot = path.resolve(process.cwd(), "storage", "uploads");
    const fileSystemPath = path.resolve(uploadsRoot, relativePath);
    const isInsideUploadsRoot = fileSystemPath === uploadsRoot || fileSystemPath.startsWith(`${uploadsRoot}${path.sep}`);
    if (!isInsideUploadsRoot) {
      return NextResponse.json({ error: "유효하지 않은 파일 경로입니다." }, { status: 400 });
    }

    let fileStat;
    try {
      fileStat = await fs.stat(fileSystemPath);
    } catch {
      return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
    }

    if (!fileStat.isFile()) {
      return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
    }

    const fileBuffer = await fs.readFile(fileSystemPath);
    const mimeType = mime.lookup(fileSystemPath) || "application/octet-stream";
    const fileName = order.latestFileName || path.basename(fileSystemPath);

    await query.incrementStoreProductDownloadCount(order.productId);

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": fileBuffer.length.toString(),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    });
  } catch (err) {
    console.error("[GET /api/store/orders/:uuid/download] 오류:", err);
    return NextResponse.json({ error: "서버 오류 발생" }, { status: 500 });
  }
}
