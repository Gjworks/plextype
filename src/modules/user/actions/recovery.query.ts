import prisma from "@utils/db/prisma";

export type RecoveryUser = {
  id: number;
  accountId: string;
  email_address: string;
  nickName: string;
  status: string | null;
};

export type PasswordResetTokenRecord = {
  id: number;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
};

const ensurePasswordResetTokenTable = async () => {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
      "id" SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL,
      "tokenHash" TEXT NOT NULL UNIQUE,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "usedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
    )
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "idx_password_reset_token_user"
    ON "PasswordResetToken"("userId")
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "idx_password_reset_token_expires"
    ON "PasswordResetToken"("expiresAt")
  `;
};

export const findRecoveryUserByEmail = async (email: string) => {
  const rows = await prisma.$queryRaw<RecoveryUser[]>`
    SELECT "id", "accountId", "email_address", "nickName", "status"
    FROM "User"
    WHERE LOWER("email_address") = LOWER(${email})
    LIMIT 1
  `;

  return rows[0] || null;
};

export const findRecoveryUserByAccountAndEmail = async (accountId: string, email: string) => {
  const rows = await prisma.$queryRaw<RecoveryUser[]>`
    SELECT "id", "accountId", "email_address", "nickName", "status"
    FROM "User"
    WHERE LOWER("accountId") = LOWER(${accountId})
      AND LOWER("email_address") = LOWER(${email})
    LIMIT 1
  `;

  return rows[0] || null;
};

export const createPasswordResetToken = async (userId: number, tokenHash: string, expiresAt: Date) => {
  await ensurePasswordResetTokenTable();

  await prisma.$executeRaw`
    UPDATE "PasswordResetToken"
    SET "usedAt" = NOW()
    WHERE "userId" = ${userId}
      AND "usedAt" IS NULL
  `;

  await prisma.$executeRaw`
    INSERT INTO "PasswordResetToken" ("userId", "tokenHash", "expiresAt")
    VALUES (${userId}, ${tokenHash}, ${expiresAt})
  `;
};

export const findValidPasswordResetToken = async (tokenHash: string) => {
  await ensurePasswordResetTokenTable();

  const rows = await prisma.$queryRaw<PasswordResetTokenRecord[]>`
    SELECT "id", "userId", "tokenHash", "expiresAt", "usedAt"
    FROM "PasswordResetToken"
    WHERE "tokenHash" = ${tokenHash}
      AND "usedAt" IS NULL
      AND "expiresAt" > NOW()
    LIMIT 1
  `;

  return rows[0] || null;
};

export const markPasswordResetTokenUsed = async (id: number) => {
  await prisma.$executeRaw`
    UPDATE "PasswordResetToken"
    SET "usedAt" = NOW()
    WHERE "id" = ${id}
  `;
};

export const updateUserPasswordAndClearSession = async (userId: number, passwordHash: string) => {
  await prisma.$executeRaw`
    UPDATE "User"
    SET "password" = ${passwordHash},
        "refreshToken" = NULL,
        "updateAt" = NOW()
    WHERE "id" = ${userId}
  `;
};

export const findPublicSiteUrl = async () => {
  const rows = await prisma.$queryRaw<{ value: string | null }[]>`
    SELECT "value"
    FROM "AppSetting"
    WHERE "key" = 'site.url'
    LIMIT 1
  `;

  return rows[0]?.value || process.env.NEXT_PUBLIC_DEFAULT_URL || "http://localhost:3000";
};

// 안내 메일 제목 머리말에 쓰는 사이트 제목. 관리자 설정이 없으면 환경 변수, 그것도 없으면 배포판 이름을 쓴다.
// 관리자 모듈의 설정 액션을 거치지 않고 설정 테이블을 직접 읽는다: 기능 모듈은 관리자 모듈을 import하지 않는다.
export const findSiteTitle = async () => {
  const rows = await prisma.$queryRaw<{ value: string | null }[]>`
    SELECT "value"
    FROM "AppSetting"
    WHERE "key" = 'site.projectTitle'
    LIMIT 1
  `;

  return rows[0]?.value || process.env.PROJECT_TITLE || "Plextype";
};

export const deleteExpiredPasswordResetTokens = async () => {
  await ensurePasswordResetTokenTable();

  await prisma.$executeRaw`
    DELETE FROM "PasswordResetToken"
    WHERE "expiresAt" < NOW() - INTERVAL '1 day'
       OR "usedAt" IS NOT NULL
  `;
};
