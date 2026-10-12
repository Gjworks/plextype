import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import mime from "mime-types";

import { canReadUpload } from "@/modules/attachment/lib/access";
import { getBoardViewer } from "@/modules/posts/actions/access";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname; // /api/storage/uploads/temp/.../파일.png
    const relativePath = decodeURIComponent(pathname.replace(/^\/(?:api\/)?storage\/uploads\//, ""));

    if (!relativePath || relativePath.includes("\0") || path.isAbsolute(relativePath)) {
      return NextResponse.json({ error: "유효하지 않은 경로" }, { status: 400 });
    }

    const uploadsRoot = path.resolve(process.cwd(), "storage", "uploads");
    const fileSystemPath = path.resolve(uploadsRoot, relativePath);
    const isInsideUploadsRoot = fileSystemPath === uploadsRoot || fileSystemPath.startsWith(`${uploadsRoot}${path.sep}`);

    if (!isInsideUploadsRoot) {
      return NextResponse.json({ error: "유효하지 않은 경로" }, { status: 400 });
    }

    if (!await canReadUpload(`/storage/uploads/${relativePath}`, await getBoardViewer())) {
      return NextResponse.json({ error: "파일에 접근할 권한이 없습니다." }, { status: 403 });
    }
    const [realRoot, realPath] = await Promise.all([fs.realpath(uploadsRoot), fs.realpath(fileSystemPath)]);
    if (!realPath.startsWith(`${realRoot}${path.sep}`)) {
      return NextResponse.json({ error: "유효하지 않은 경로" }, { status: 403 });
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

    const fileBuffer = await fs.readFile(realPath);
    const mimeType = mime.lookup(fileSystemPath) || "application/octet-stream";
    const dispositionType = /^(image|audio|video)\//.test(mimeType) ? "inline" : "attachment";

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": fileBuffer.length.toString(),
        "Content-Disposition": `${dispositionType}; filename="${encodeURIComponent(path.basename(fileSystemPath))}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
        "Content-Security-Policy": "sandbox; default-src 'none'",
      },
    });
  } catch (err) {
    console.error("[GET /api/storage/uploads] 오류:", err);
    return NextResponse.json({ error: "서버 오류 발생" }, { status: 500 });
  }
}
