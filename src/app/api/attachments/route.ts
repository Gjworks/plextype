import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { mkdir, writeFile, readFile,stat } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import prisma from "@plextype/utils/db/prisma";
import mime from "mime-types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const resourceType = searchParams.get("resourceType") ?? "etc";
    const resourceId = Number(searchParams.get("resourceId")) || 0;

    // 💡 클라이언트에서 보낸 tempId를 가져옵니다.
    const clientTempId = searchParams.get("tempId");

    const isTemporary = resourceId === 0;

    // 💡 신규 작성(isTemporary)일 때 tempId가 반드시 있어야 합니다.
    if (isTemporary && !clientTempId) {
      return NextResponse.json({ error: "임시 파일 관리를 위한 tempId가 누락되었습니다." }, { status: 400 });
    }

    // DB와 경로에 사용할 tempId를 결정합니다.
    const tempId = clientTempId;

    const dirIdentifier = isTemporary
      ? (tempId as string) // ✨ tempId가 string임을 명시적으로 단언 (null 검사 통과 후)
      : String(resourceId);
    const basePath = isTemporary ? "temp" : resourceType; // 'temp' 폴더 사용

    const uploadDir = path.join(process.cwd(), "public", "uploads", basePath, dirIdentifier);

    const formData = await req.formData();
    const files = formData.getAll("file");

    // 배열을 순회하며 실제 파일 객체를 찾습니다.
    let file: FormDataEntryValue | null = null;
    for (const item of files) {
      if (item && typeof item === 'object' && 'name' in item && 'size' in item && typeof (item as any).arrayBuffer === 'function') {
        file = item;
        break;
      }
    }

    if (!file) {
      return NextResponse.json({ error: "파일 없음 또는 잘못된 형식" }, { status: 400 });
    }

    // 파일명을 고유한 UUID로 생성합니다.
    const fileUuid = uuidv4();
    const ext = path.extname((file as any).name || "");
    const fileName = `${fileUuid}${ext}`;

    await mkdir(uploadDir, { recursive: true });
    const fullPath = path.join(uploadDir, fileName);

    const bytes = await (file as any).arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(fullPath, buffer);

    // DB에 저장할 데이터
    const dbPath = `/uploads/${basePath}/${dirIdentifier}/${fileName}`;
    const attachmentResourceType = isTemporary ? "temp" : resourceType;

    const attachment = await prisma.attachment.create({
      data: {
        uuid: uuidv4(), // uuid 필드에 값 할당
        fileName,
        originalName: (file as any).name || "unknown",
        mimeType: (file as any).type || "application/octet-stream",
        size: (file as any).size,
        path: dbPath,
        resourceType: attachmentResourceType,
        resourceId: isTemporary ? 0 : resourceId,
        tempId: isTemporary ? tempId : null, // 💡 클라이언트에서 받은 tempId를 DB에 저장
        uploadedById: null,
      },
    });

    return NextResponse.json(attachment);
  } catch (err) {
    console.error("첨부파일 업로드 실패:", err);
    return NextResponse.json({ error: "업로드 실패" }, { status: 500 });
  }
}


// =========================================================================
// GET: 파일 목록 조회 및 파일 콘텐츠 전송 (ArrayBuffer 복사 적용)
// =========================================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const relativePath = searchParams.get("path");
    const resourceType = searchParams.get("resourceType");
    const resourceId = Number(searchParams.get("resourceId"));

    // 1. 목록 조회 로직
    if (!relativePath && resourceType && resourceId > 0 && !isNaN(resourceId)) {
      const attachments = await prisma.attachment.findMany({
        where: { resourceType, resourceId, tempId: null },
        select: { id: true, originalName: true, size: true, path: true, mimeType: true },
      });

      const filepondFiles = attachments.map(att => ({
        source: att.path,
        options: {
          type: 'local',
          file: {
            name: att.originalName,
            size: att.size,
            type: att.mimeType,
          },
          metadata: { id: att.id },
        },
      }));

      return NextResponse.json(filepondFiles);
    }

    // 2. 파일 콘텐츠 조회
    if (!relativePath || !relativePath.startsWith("/uploads/") || relativePath.includes("..")) {
      return new NextResponse("유효하지 않은 파일 경로입니다.", { status: 400 });
    }

    // DB 메타데이터 조회
    const attachment = await prisma.attachment.findFirst({
      where: { path: relativePath },
      select: { mimeType: true, originalName: true },
    });

    if (!attachment) {
      return new NextResponse("첨부파일 메타데이터를 찾을 수 없습니다.", { status: 404 });
    }

    const fileSystemPath = path.join(process.cwd(), "public", relativePath);

    const fileStat = await stat(fileSystemPath);
    const fileBuffer = await readFile(fileSystemPath);

    const mimeType = attachment.mimeType || mime.lookup(fileSystemPath) || "application/octet-stream";

    // 🔥 ArrayBuffer 복사를 통해 타입 오류와 호환성 문제를 해결합니다.
    const responseArrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.length
    );

    // 복사된 ArrayBuffer를 Response에 전달합니다.
    return new Response(responseArrayBuffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": fileStat.size.toString(),
        "Content-Disposition": `inline; filename="${attachment.originalName || path.basename(fileSystemPath)}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.error(`[GET /api/attachments] ❌ 파일 시스템 경로에 파일 없음: ${error.path}`);
      return new NextResponse("파일을 찾을 수 없습니다. (경로 오류)", { status: 404 });
    }
    console.error("[GET /api/attachments] 💥 서버 오류 발생:", error);
    return new NextResponse("파일 로드 중 서버 오류 발생.", { status: 500 });
  }
}