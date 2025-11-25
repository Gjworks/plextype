import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import mime from "mime-types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname; // /api/files/uploads/temp/.../파일.png
    const relativePath = pathname.replace(/^\/api\/files\/uploads\//, "");

    if (!relativePath || relativePath.includes("..")) {
      return NextResponse.json({ error: "유효하지 않은 경로" }, { status: 400 });
    }

    const fileSystemPath = path.join(process.cwd(), "files", "uploads", relativePath);

    console.log("pathname:", pathname);
    console.log("relativePath:", relativePath);
    console.log("fileSystemPath:", fileSystemPath);
    try {
      await fs.access(fileSystemPath);
    } catch {
      return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
    }

    const fileBuffer = await fs.readFile(fileSystemPath);
    const mimeType = mime.lookup(fileSystemPath) || "application/octet-stream";

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": fileBuffer.length.toString(),
        "Content-Disposition": `inline; filename="${path.basename(fileSystemPath)}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[GET /api/files/uploads] 오류:", err);
    return NextResponse.json({ error: "서버 오류 발생" }, { status: 500 });
  }
}