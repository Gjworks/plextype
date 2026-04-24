import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

/**
 * 🚀 Plextype System Diagnostic API
 * 이 API는 시스템의 핵심 구성 요소(DB, Storage, Env)의 상태를 실시간으로 진단합니다.
 */

// 매번 실시간 상태를 확인하기 위해 캐싱을 비활성화합니다.
export const dynamic = 'force-dynamic';

export async function GET() {
  const status = {
    db: false,
    storage: false,
    env: false,
  };

  // 1. Database 연결 진단 (Prisma)
  const prisma = new PrismaClient();
  try {
    // 가장 가벼운 쿼리로 DB 생존 여부 확인
    await prisma.$queryRaw`SELECT 1`;
    status.db = true;
  } catch (error) {
    console.error("[Diagnostic] DB Connection Failed:", error);
    status.db = false;
  } finally {
    // 85원 정신: 리소스 누수 방지를 위해 반드시 연결 종료
    await prisma.$disconnect();
  }

  // 2. Storage 폴더 쓰기 권한 진단
  try {
    const storagePath = path.join(process.cwd(), 'storage');

    // 폴더 존재 여부 및 쓰기 권한(W_OK) 확인
    if (fs.existsSync(storagePath)) {
      fs.accessSync(storagePath, fs.constants.W_OK);
      status.storage = true;
    } else {
      status.storage = false;
    }
  } catch (error) {
    console.error("[Diagnostic] Storage Access Denied:", error);
    status.storage = false;
  }

  // 3. .env 환경 변수 파일 존재 여부 진단
  try {
    const envPath = path.join(process.cwd(), '.env');
    status.env = fs.existsSync(envPath);
  } catch (error) {
    status.env = false;
  }

  // 최종 상태 반환
  return NextResponse.json(status);
}