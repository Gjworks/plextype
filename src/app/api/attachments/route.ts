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
    // const { searchParams } = new URL(req.url);
    const formData = await req.formData();
    // const resourceType = formData.get("resourceType") ?? "etc";
    const resourceTypeValue = formData.get("resourceType");
    const resourceTypeStr =
      typeof resourceTypeValue === "string" ? resourceTypeValue : "etc"; // 기본값 설정
    const resourceId = Number(formData.get("resourceId")) || 0;
    const documentId = Number(formData.get("documentId")) || 0;

    const accessToken = req.cookies.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const verifyToken = await verify(accessToken!);
    if (!verifyToken || !verifyToken.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = verifyToken.id;

    const tempIdValue = formData.get("tempId");
    const tempIdStr =
      typeof tempIdValue === "string" ? tempIdValue : null; // null 처리도 가능
    const isTemporary = documentId === 0;

    if (isTemporary && !tempIdStr) {

      return NextResponse.json({ error: "임시 파일 관리를 위한 tempId가 누락되었습니다." }, { status: 400 });
    }

    const tempId = tempIdStr;
    const dirIdentifier = isTemporary
      ? (tempId as string)
      : String(documentId);
    const uploadBaseDir = path.join(process.cwd(), "files", "uploads");
    const basePath = isTemporary ? "temp" : resourceTypeStr;
    const uploadDir = path.join(uploadBaseDir, basePath, dirIdentifier);
    await mkdir(uploadDir, { recursive: true });

    // const formData = await req.formData();
    // ⭐️ 클라이언트가 보내는 실제 필드 이름인 'filepond-attachments'를 사용합니다.
    const fileEntry = formData.get("file-attachments");

    // ⭐️ 수정된 핵심 로직: File ReferenceError를 피하기 위해 속성 기반 검증을 사용합니다.
    const isFileValid =
      fileEntry &&
      typeof fileEntry === 'object' &&
      'name' in fileEntry &&
      'size' in fileEntry &&
      typeof (fileEntry as any).arrayBuffer === 'function' &&
      (fileEntry as any).size > 0;

    if (!isFileValid) {
      console.error("DEBUG [POST] 파일 추출 실패: fileEntry is not a valid file-like object.", fileEntry);
      return NextResponse.json({ error: "파일 없음 또는 잘못된 형식" }, { status: 400 });
    }

    console.log("uploadDir:", uploadDir);

    // 이제 file 변수는 유효한 파일 객체로 간주합니다.
    const file = fileEntry as FileData;
    // 파일명을 고유한 UUID로 생성합니다.
    const fileUuid = uuidv4();
    const ext = path.extname(file.name || "").toLowerCase(); //확장자 소문자 처리
    const fileName = `${fileUuid}${ext}`;
    console.log('fileName', fileName)
    // ✅ 허용 확장자 목록
    const allowedExts = [
      ".png", ".jpg", ".jpeg", ".gif",
      ".mp3", ".mp4", ".avif", ".webm", ".webp",
      ".mov", ".ogg", ".zip"
    ];

    // ✅ MIME 타입 기준 검증도 병행 (더 안전)
    const allowedMimeTypes = [
      "image/png", "image/jpeg", "image/gif", "image/avif", "image/webp",
      "audio/mpeg", "audio/ogg",
      "video/mp4", "video/webm", "video/quicktime", // mov = quicktime
      "application/zip"
    ];

    if (!allowedExts.includes(ext) || !allowedMimeTypes.includes(file.type)) {
      console.warn(`차단된 파일 업로드 시도: ${file.name} (${file.type})`);
      return NextResponse.json({ error: "허용되지 않은 파일 형식입니다." }, { status: 400 });
    }

    await mkdir(uploadDir, { recursive: true });
    const fullPath = path.join(uploadDir, fileName);

    // File 객체의 arrayBuffer() 메서드를 사용하여 데이터를 읽습니다.
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(fullPath, buffer);

    // DB에 저장할 데이터
    const dbPath = `/files/uploads/${basePath}/${dirIdentifier}/${fileName}`;

    const attachment = await prisma.attachment.create({
      data: {
        uuid: uuidv4(),
        fileName,
        originalName: file.name || "unknown",
        mimeType: file.type || "application/octet-stream",
        size: file.size, // 파일 객체의 size 속성 사용
        path: dbPath,
        resourceType: resourceTypeStr,
        resourceId: resourceId,
        documentId: isTemporary ? 0 : documentId,
        tempId: isTemporary ? tempIdStr : null,
        userId: currentUserId,
      },
    });

// GET과 동일한 구조로 통일
    const responseData = {
      id: attachment.id,
      uuid: attachment.uuid,
      name: attachment.originalName,
      size: attachment.size,
      path: `/api${attachment.path}`,
      mimeType: attachment.mimeType,
    };


    console.log("DEBUG [POST] ✅ 파일 업로드 및 DB 기록 성공:", attachment.path);
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
          path: `/api${att.path}`,
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
        path: `/api${att.path}`,
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