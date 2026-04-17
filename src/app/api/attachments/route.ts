import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { mkdir, writeFile, readdir, unlink, rmdir } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/core/utils/db/prisma";
import dayjs from "dayjs";
import { verify } from "@/core/utils/auth/jwtAuth";

export const runtime = "nodejs";

const ALLOWED_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".mp3", ".mp4", ".avif", ".webm", ".webp", ".mov", ".ogg", ".zip"];
const ALLOWED_MIMES = ["image/png", "image/jpeg", "image/gif", "image/avif", "image/webp", "audio/mpeg", "audio/ogg", "video/mp4", "video/webm", "video/quicktime", "application/zip"];

// =========================================================================
// POST: 유저 보관함에 파일 업로드
// =========================================================================
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // 1. 인증 확인 (누가 올리는지만 알면 됩니다)
    const accessToken = req.cookies.get("accessToken")?.value;
    if (!accessToken) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const verifyToken = await verify(accessToken);
    if (!verifyToken || !verifyToken.id) return NextResponse.json({ error: "유효하지 않은 토큰입니다." }, { status: 401 });
    const userId = verifyToken.id;

    // 2. 파일 수신 및 유효성 검사
    const file = formData.get("file-attachments") as unknown as File;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "파일이 없거나 잘못된 형식입니다." }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTS.includes(ext) || !ALLOWED_MIMES.includes(file.type)) {
      return NextResponse.json({ error: "허용되지 않은 파일 형식입니다." }, { status: 400 });
    }

    // 3. 🌟 물리적 경로 생성 (심볼릭 링크 구조에 맞춤)
    const fileUuid = uuidv4();
    const fileName = `${fileUuid}${ext}`;
    const datePath = dayjs().format("YYYY/MM");

    // 물리 저장 경로: 프로젝트루트/storage/uploads/...
    const uploadDir = path.join(
      /* turbopackIgnore: true */ process.cwd(),
      "storage", "uploads", String(userId), datePath
    );
    // DB 저장 경로 (브라우저 접근용): /storage/uploads/...
    const dbPath = `/storage/uploads/${userId}/${datePath}/${fileName}`;

    // 4. 파일 저장
    await mkdir(uploadDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(path.join(uploadDir, fileName), Buffer.from(bytes));

    // 5. 📝 DB 기록 (게시글 연결 정보 제외, 유저 소유권만 기록)
    const attachment = await prisma.attachment.create({
      data: {
        uuid: fileUuid,
        fileName: fileName,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: dbPath,
        userId: userId,
      },
    });

    return NextResponse.json(attachment);

  } catch (err) {
    console.error("업로드 오류:", err);
    return NextResponse.json({ error: "업로드 실패" }, { status: 500 });
  }
}

// =========================================================================
// GET: 내 보관함 전체 파일 목록 조회
// =========================================================================
export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("accessToken")?.value;
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const verifyToken = await verify(accessToken);
    if (!verifyToken || !verifyToken.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const currentUserId = verifyToken.id;

    // 🌟 특정 게시글 조건 없이 "내 파일" 전부 가져오기
    const attachments = await prisma.attachment.findMany({
      where: { userId: currentUserId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(attachments);

  } catch (err) {
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}

// =========================================================================
// DELETE: 보관함에서 파일 삭제 (기존 로직 유지)
// =========================================================================
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = Number(searchParams.get("fileId"));

    const accessToken = req.cookies.get("accessToken")?.value;
    const verifyToken = await verify(accessToken!);
    const currentUserId = verifyToken?.id;

    const attachment = await prisma.attachment.findUnique({ where: { id: fileId } });
    if (!attachment || attachment.userId !== currentUserId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 물리 파일 삭제 (심볼릭 링크 덕분에 /storage 경로 기준 삭제 가능)
    const filePath = path.join(
      /* turbopackIgnore: true */ process.cwd(),
      attachment.path.substring(1)
    );
    await unlink(filePath).catch(() => {});

    await prisma.attachment.delete({ where: { id: fileId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}