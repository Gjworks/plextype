import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import prisma from "@/core/utils/db/prisma";

// API 토큰: 사람 대신 프로그램(다른 사이트의 설치기, 통합 관리 도구 등)이 이 사이트의 API를 부를 때 쓰는 열쇠.
// 원문은 `pxt_<식별자>_<비밀값>`이다. 식별자로 행을 찾고, 비밀값은 SHA-256 해시만 저장해 대조한다.
// 원문은 발급하거나 재발급할 때 한 번만 돌려주며 다시 볼 수 없다.
//
// 토큰에는 권한 범위(scopes)가 붙고, API는 자기가 요구하는 범위가 있는 토큰만 받는다.
// 범위는 화면에서 넘어온 값을 그대로 쓰지 말고, 토큰을 발급하는 서버 코드가 정해서 넘긴다.

const TOKEN_PATTERN = /^pxt_([a-f0-9]{16})_([a-f0-9]{48})$/;
const SCOPE_PATTERN = /^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/;
// 한 회원이 유지할 수 있는 유효 토큰 수. 쓰는 곳마다 하나씩 만들기에 충분하고, 무한 발급은 막는다.
export const MAX_ACTIVE_API_TOKENS = 20;

const hashSecret = (secret: string) => createHash("sha256").update(secret).digest("hex");
const newCredentials = () => {
  const tokenId = randomBytes(8).toString("hex");
  const secret = randomBytes(24).toString("hex");
  return { tokenId, secretHash: hashSecret(secret), token: `pxt_${tokenId}_${secret}` };
};

export const findActiveApiTokensByUser = (userId: number) => prisma.apiToken.findMany({
  where: { userId, revokedAt: null },
  select: { tokenId: true, name: true, scopes: true, createdAt: true, lastUsedAt: true },
  orderBy: [{ createdAt: "desc" }, { id: "desc" }],
});

export const createApiToken = async (userId: number, name: string, scopes: string[]) => {
  if (scopes.length === 0 || !scopes.every((scope) => SCOPE_PATTERN.test(scope))) throw new Error("Invalid API token scopes");
  const { token, ...credentials } = newCredentials();
  await prisma.apiToken.create({ data: { ...credentials, userId, name, scopes } });
  return token;
};

// 이름과 권한은 그대로 두고 토큰 값만 바꾼다. 이전 값은 그 즉시 통하지 않는다.
export const rotateApiToken = async (userId: number, tokenId: string) => {
  const { token, ...credentials } = newCredentials();
  const { count } = await prisma.apiToken.updateMany({
    where: { tokenId, userId, revokedAt: null },
    data: { ...credentials, lastUsedAt: null },
  });
  return count ? token : null;
};

export const revokeApiToken = async (userId: number, tokenId: string) => {
  const { count } = await prisma.apiToken.updateMany({
    where: { tokenId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return count > 0;
};

export const readBearerToken = (header: string | null) => {
  const match = /^Bearer\s+(\S+)$/i.exec(header || "");
  return match ? match[1] : null;
};

// 토큰이 유효하고 요구한 권한을 가졌으면 주인과 토큰 이름을 돌려준다. 정지·탈퇴한 회원의 토큰은 통하지 않는다.
export const verifyApiToken = async (token: string, requiredScope: string) => {
  const match = TOKEN_PATTERN.exec(token);
  if (!match) return null;
  const row = await prisma.apiToken.findFirst({
    where: { tokenId: match[1], revokedAt: null },
    select: {
      id: true, secretHash: true, userId: true, name: true, scopes: true, lastUsedAt: true,
      user: { select: { nickName: true, accountId: true, status: true, isAdmin: true } },
    },
  });
  if (!row) return null;
  const expected = Buffer.from(row.secretHash, "hex");
  const actual = Buffer.from(hashSecret(match[2]), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  if (!row.scopes.includes(requiredScope)) return null;
  if (!row.user.isAdmin && row.user.status && row.user.status !== "active") return null;
  // 사용 시각은 화면의 참고용이라 분 단위로만 갱신해 요청마다 쓰지 않게 한다.
  if (!row.lastUsedAt || Date.now() - row.lastUsedAt.getTime() > 60_000) {
    await prisma.apiToken.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } });
  }
  return { userId: row.userId, tokenName: row.name, accountName: row.user.nickName || row.user.accountId || "" };
};
