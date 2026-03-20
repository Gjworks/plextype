import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { mkdir, writeFile, readdir, unlink, rmdir, stat } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/utils/db/prisma";
import dayjs from "dayjs";
import {verify} from "@/utils/auth/jwtAuth";

export const runtime = "nodejs";

const ALLOWED_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".mp3", ".mp4", ".avif", ".webm", ".webp", ".mov", ".ogg", ".zip"];
const ALLOWED_MIMES = ["image/png", "image/jpeg", "image/gif", "image/avif", "image/webp", "audio/mpeg", "audio/ogg", "video/mp4", "video/webm", "video/quicktime", "application/zip"];

interface FileData {
  name: string;
  size: number;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
  // 필요한 다른 속성/메서드가 있다면 여기에 추가
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // 1. 인증 확인 및 회원 번호(userId) 추출
    const accessToken = req.cookies.get("accessToken")?.value;
    if (!accessToken) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const verifyToken = await verify(accessToken);
    if (!verifyToken || !verifyToken.id) return NextResponse.json({ error: "유효하지 않은 토큰입니다." }, { status: 401 });
    const userId = verifyToken.id;

    // 2. 파라미터 파싱 (논리적 연결용)
    const resourceType = (formData.get("resourceType") as string) || "posts";
    const resourceId = Number(formData.get("resourceId")) || 0;
    const tempId = formData.get("tempId") as string | null;

    // 3. 파일 유효성 검사
    const file = formData.get("file-attachments") as unknown as File;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "파일이 없거나 잘못된 형식입니다." }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTS.includes(ext) || !ALLOWED_MIMES.includes(file.type)) {
      return NextResponse.json({ error: "허용되지 않은 파일 형식입니다." }, { status: 400 });
    }

    // 4. 🌟 물리적 경로 및 파일명 생성
    const fileUuid = uuidv4();
    const fileName = `${fileUuid}${ext}`;
    const datePath = dayjs().format("YYYY/MM"); // 예: 2026/03/19

    // 물리 경로: 프로젝트루트/storage/uploads/{userId}/{날짜}/
    const uploadDir = path.join(process.cwd(), "storage", "uploads", String(userId), datePath);
    // DB 저장용 경로 (웹 URL 표준)
    const dbPath = `/storage/uploads/${userId}/${datePath}/${fileName}`;

    // 5. 📂 물리적 파일 저장 (mkdir & writeFile)
    // recursive: true 옵션으로 userId부터 날짜 폴더까지 한 번에 생성합니다.
    await mkdir(uploadDir, { recursive: true });

    // 파일 데이터를 Buffer로 변환하여 기록합니다.
    const bytes = await file.arrayBuffer();
    await writeFile(path.join(uploadDir, fileName), Buffer.from(bytes));

    console.log(`[UPLOAD SUCCESS] User: ${userId}, Path: ${dbPath}`);

    // 6. 📝 DB(Attachment) 기록
    // 물리 경로는 고정되었지만, 게시글과의 연결을 위해 tempId와 userId를 기록합니다.
    const attachment = await prisma.attachment.create({
      data: {
        uuid: uuidv4(),
        fileName: fileName,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: dbPath,
        resourceType: resourceType,
        resourceId: resourceId,
        tempId: tempId,       // 새 글 작성 시 연결 고리
        userId: userId,       // 소유자 (회원 번호)
        documentId: null,     // 아직 게시글 저장 전
      },
    });

    // 7. 클라이언트 응답 (PostWrite 등에서 사용)
    return NextResponse.json({
      id: attachment.id,
      uuid: attachment.uuid,
      name: attachment.originalName,
      size: attachment.size,
      path: attachment.path,
      mimeType: attachment.mimeType,
    });

  } catch (err) {
    console.error("첨부파일 업로드 중 서버 오류:", err);
    return NextResponse.json({ error: "업로드 실패" }, { status: 500 });
  }
}

// =========================================================================
// GET: 파일 목록 조회
// =========================================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const resourceType = searchParams.get("resourceType");
    const documentId = Number(searchParams.get("documentId"));
    const tempId = searchParams.get("tempId");

    // 인증 확인
    const accessToken = req.cookies.get("accessToken")?.value;
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const verifyToken = await verify(accessToken);
    if (!verifyToken || !verifyToken.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const currentUserId = verifyToken.id;

    if (!resourceType && !documentId && !tempId) {
      return NextResponse.json({ error: "조회 조건이 없습니다." }, { status: 400 });
    }

    let attachments;

    if (tempId) {
      // 1. 임시 파일 조회 (작성 중인 유저 본인 것만)
      attachments = await prisma.attachment.findMany({
        where: {
          userId: currentUserId,
          tempId: tempId,
          documentId: null,
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (documentId) {
      // 2. 특정 게시글에 연결된 파일 조회
      attachments = await prisma.attachment.findMany({
        where: {
          resourceType: resourceType || undefined,
          documentId: documentId,
        },
        orderBy: { createdAt: "asc" },
      });
    } else {
      attachments = [];
    }

    return NextResponse.json(
      attachments.map(att => ({
        id: att.id,
        uuid: att.uuid,
        name: att.originalName,
        size: att.size,
        path: att.path,
        mimeType: att.mimeType,
      }))
    );

  } catch (err) {
    console.error("[GET /api/attachments] 오류:", err);
    return NextResponse.json({ error: "서버 오류 발생" }, { status: 500 });
  }
}

// =========================================================================
// DELETE: 파일 삭제 (물리 파일 + 빈 폴더 정리 + DB 삭제)
// =========================================================================
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = Number(searchParams.get("fileId"));
    if (!fileId) return NextResponse.json({ error: "fileId가 필요합니다." }, { status: 400 });

    // 1. 인증 및 권한 확인
    const accessToken = req.cookies.get("accessToken")?.value;
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const verifyToken = await verify(accessToken);
    if (!verifyToken || !verifyToken.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const currentUserId = verifyToken.id;

    // 2. DB에서 파일 정보 조회
    const attachment = await prisma.attachment.findUnique({
      where: { id: fileId },
    });

    if (!attachment) return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });

    // 3. 본인 파일인지 확인 (관리자 예외 처리 가능)
    if (attachment.userId !== currentUserId) {
      return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
    }

    // 4. 물리 파일 삭제 경로 계산
    // DB path 예: /storage/uploads/1/2026/03/19/uuid.png
    // 실제 경로: 프로젝트루트 + storage/uploads/1/2026/03/19/uuid.png
    const filePath = path.join(process.cwd(), attachment.path.substring(1));

    try {
      // 물리 파일 삭제
      await unlink(filePath);
      console.log(`🗑️ 물리 파일 삭제 완료: ${filePath}`);

      // 5. 빈 폴더 정리 (날짜 폴더가 비었으면 삭제)
      const folderPath = path.dirname(filePath);
      const filesInFolder = await readdir(folderPath);

      if (filesInFolder.length === 0) {
        await rmdir(folderPath);
        console.log(`📁 빈 폴더 삭제 완료: ${folderPath}`);
      }
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        console.error("파일 삭제 중 오류 발생:", err);
      } else {
        console.warn("파일이 이미 존재하지 않습니다.");
      }
    }

    // 6. DB 레코드 삭제
    await prisma.attachment.delete({
      where: { id: fileId },
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("❌ 파일 삭제 처리 실패:", err);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}