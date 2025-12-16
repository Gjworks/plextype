import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { mkdir, writeFile, readFile,stat } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import prisma from "@plextype/utils/db/prisma";
import mime from "mime-types";
import {verify} from "@plextype/utils/auth/jwtAuth";

export const runtime = "nodejs";

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

    // 1. 파라미터 파싱
    const resourceTypeValue = formData.get("resourceType");
    const resourceTypeStr = typeof resourceTypeValue === "string" ? resourceTypeValue : "etc";
    const resourceId = Number(formData.get("resourceId")) || 0;
    const documentId = Number(formData.get("documentId")) || 0;

    // 2. 인증 토큰 확인
    const accessToken = req.cookies.get("accessToken")?.value;
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const verifyToken = await verify(accessToken!);
    if (!verifyToken || !verifyToken.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUserId = verifyToken.id;

    // 3. 임시 파일(Temp) 여부 확인
    const tempIdValue = formData.get("tempId");
    const tempIdStr = typeof tempIdValue === "string" ? tempIdValue : null;
    const isTemporary = documentId === 0; // documentId가 0이면 새 글 작성 중(임시)

    if (isTemporary && !tempIdStr) {
      return NextResponse.json({ error: "tempId가 누락되었습니다." }, { status: 400 });
    }

    // 4. 파일 유효성 검사 (먼저 수행하여 불필요한 로직 방지)
    const fileEntry = formData.get("file-attachments");
    const isFileValid =
      fileEntry &&
      typeof fileEntry === 'object' &&
      'name' in fileEntry &&
      'size' in fileEntry &&
      typeof (fileEntry as any).arrayBuffer === 'function' &&
      (fileEntry as any).size > 0;

    if (!isFileValid) {
      return NextResponse.json({ error: "파일이 없거나 잘못된 형식입니다." }, { status: 400 });
    }

    const file = fileEntry as FileData;
    const fileUuid = uuidv4();
    const ext = path.extname(file.name || "").toLowerCase();
    const fileName = `${fileUuid}${ext}`;

    // 확장자 및 MIME 타입 체크
    const allowedExts = [".png", ".jpg", ".jpeg", ".gif", ".mp3", ".mp4", ".avif", ".webm", ".webp", ".mov", ".ogg", ".zip"];
    const allowedMimeTypes = ["image/png", "image/jpeg", "image/gif", "image/avif", "image/webp", "audio/mpeg", "audio/ogg", "video/mp4", "video/webm", "video/quicktime", "application/zip"];

    if (!allowedExts.includes(ext) || !allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: "허용되지 않은 파일 형식입니다." }, { status: 400 });
    }

    // =================================================================================
    // ⭐️ 5. 경로 생성 로직 분기 (핵심 수정 부분)
    // =================================================================================
    let uploadDir: string;
    let dbPath: string;

    if (isTemporary) {
      // [CASE A] 임시 파일 저장 (작성 중)
      // 물리 경로: /files/temp/{tempId}/
      // DB 경로: /files/temp/{tempId}/{fileName}

      const tempBaseDir = path.join(process.cwd(), "files", "temp");
      uploadDir = path.join(tempBaseDir, tempIdStr as string);

      dbPath = `/files/temp/${tempIdStr}/${fileName}`;

    } else {
      // [CASE B] 정식 게시글 파일 저장 (수정 시 등)
      // 물리 경로: /files/uploads/{resourceType}/{Year}/{Month}/{Day}/{documentId}/
      // DB 경로: /files/uploads/{resourceType}/{Year}/{Month}/{Day}/{documentId}/{fileName}

      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');

      // files/uploadsBase 까지
      const uploadBaseDir = path.join(process.cwd(), "files", "uploads");

      // uploads 아래의 상세 구조 생성
      // path.join은 OS에 따라 역슬래시(\)나 슬래시(/)를 알아서 처리합니다.
      uploadDir = path.join(
        uploadBaseDir,
        resourceTypeStr,    // 예: posts
        year,               // 예: 2025
        month,              // 예: 12
        day,                // 예: 15
        String(documentId)  // 예: 94
      );

      // DB 저장은 웹 URL 표준인 슬래시(/)를 강제해야 합니다.
      dbPath = `/files/uploads/${resourceTypeStr}/${year}/${month}/${day}/${documentId}/${fileName}`;
    }

    // 6. 폴더 생성 및 파일 저장
    // recursive: true 옵션 덕분에 중간 경로(년/월/일 등)가 없으면 알아서 다 만들어줍니다.
    await fs.mkdir(uploadDir, { recursive: true });

    const fullPath = path.join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    await fs.writeFile(fullPath, Buffer.from(bytes));

    console.log(`DEBUG [POST] 저장 위치: ${fullPath}`);

    // 7. DB 기록
    const attachment = await prisma.attachment.create({
      data: {
        uuid: uuidv4(),
        fileName,
        originalName: file.name || "unknown",
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        path: dbPath,
        resourceType: resourceTypeStr,
        resourceId: resourceId,
        documentId: isTemporary ? 0 : documentId,
        tempId: isTemporary ? tempIdStr : null,
        userId: currentUserId,
      },
    });

    const responseData = {
      id: attachment.id,
      uuid: attachment.uuid,
      name: attachment.originalName,
      size: attachment.size,
      path: `${attachment.path}`,
      mimeType: attachment.mimeType,
    };

    return NextResponse.json(responseData);

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
    const resourceType = searchParams.get("resourceType");
    const documentId = Number(searchParams.get("documentId"));
    const tempId = searchParams.get("tempId");

    const accessToken = req.cookies.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const verifyToken = await verify(accessToken!);
    if (!verifyToken || !verifyToken.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = verifyToken.id;
    if (!resourceType && !documentId && !tempId) {
      return NextResponse.json({ error: "조회 조건이 없습니다." }, { status: 400 });
    }

    if (tempId) {
      const attachments = await prisma.attachment.findMany({
        where: {
          userId: currentUserId, // 로그인한 회원 ID
          documentId: 0,         // 아직 문서에 연결되지 않은 임시 파일
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          uuid: true,
          originalName: true,
          size: true,
          path: true,
          mimeType: true,
        },
      });

      return NextResponse.json(
        attachments.map(att => ({
          id: att.id,
          uuid: att.uuid,
          name: att.originalName,
          size: att.size,
          path: `${att.path}`,
          mimeType: att.mimeType,
        }))
      );
    }

    // 기존 글 첨부파일 조회
    if (documentId) {
      const attachments = await prisma.attachment.findMany({
        where: { resourceType: resourceType ?? undefined, documentId },
        orderBy: { createdAt: "desc" },
        select: { id: true, uuid: true, originalName: true, size: true, path: true, mimeType: true },
      });

      attachments.forEach(att => {
        console.log("attachment path:", att.path);
      });
      return NextResponse.json(attachments.map(att => ({
        id: att.id,
        uuid: att.uuid,
        name: att.originalName,
        size: att.size,
        path: `${att.path}`,
        mimeType: att.mimeType,
      })));
    }

    return NextResponse.json([], { status: 200 });
  } catch (err) {
    console.error("[GET /api/attachments] 오류:", err);
    return NextResponse.json({ error: "서버 오류 발생" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = Number(searchParams.get("fileId"));
    if (!fileId) return NextResponse.json({ error: "fileId 필요" }, { status: 400 });

    const attachment = await prisma.attachment.findUnique({ where: { id: fileId } });
    if (!attachment) return NextResponse.json({ error: "파일 없음" }, { status: 404 });

    // 실제 파일 경로 계산
    let relativePath = attachment.path;
    if (relativePath.startsWith("/files/uploads/")) {
      relativePath = relativePath.replace("/files/uploads/", "");
    }
    const filePath = path.join(process.cwd(), "files", "uploads", relativePath);

    // 파일 삭제
    try {
      await fs.unlink(filePath);
      console.log("🗑️ 파일 삭제 완료:", filePath);
    } catch (err: any) {
      if (err.code !== "ENOENT") throw err;
      console.warn("⚠️ 파일 이미 없음:", filePath);
    }

    // 폴더 정리
    const folderPath = path.dirname(filePath);
    try {
      const filesInFolder = await fs.readdir(folderPath);
      if (filesInFolder.length === 0) {
        await fs.rmdir(folderPath);
        console.log("📁 빈 폴더 삭제 완료:", folderPath);
      }
    } catch (err: any) {
      if (err.code !== "ENOENT") throw err;
    }

    // DB 기록 삭제
    await prisma.attachment.delete({ where: { id: fileId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ 파일 삭제 오류:", err);
    return NextResponse.json({ error: "파일 삭제 실패" }, { status: 500 });
  }
}