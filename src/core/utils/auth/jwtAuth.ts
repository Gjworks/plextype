import { SignJWT, jwtVerify } from "jose";
import { createHmac, randomUUID } from "node:crypto";
import prisma from "@/core/utils/db/prisma";
import redis from "@/core/utils/redis/redis";
import { hashRefreshToken } from "./refreshToken";
import { timeToSeconds } from "@/core/utils/date/timeToSeconds";

type TokenType = "access" | "refresh";
interface BaseTokenPayload {
  id: number; accountId: string; isAdmin: boolean | null;
  groups?: number[]; nickName?: string | null; tokenType: TokenType; exp: number;
  sessionVersion: string; credentialVersion: string;
}
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters long");
  return new TextEncoder().encode(secret);
};
const sessionKey = (id: number) => `auth:version:${id}`;
const credentialVersion = (password: string) => createHmac("sha256", getJwtSecret()).update(password).digest("hex");

// Version keys deliberately do not expire: deleting Redis state fails closed for old tokens.
export async function revokeUserSessions(id: number) {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Invalid user ID");
  await redis.set(sessionKey(id), randomUUID());
  await prisma.user.updateMany({ where: { id }, data: { refreshToken: null } });
}
async function issue(payload: object, tokenType: TokenType, expiresIn: string | undefined) {
  const id = (payload as { id: number }).id;
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Invalid user ID");
  const user = await prisma.user.findUnique({ where: { id }, select: { password: true, status: true } });
  if (!user || (user.status && user.status !== "active")) throw new Error("Inactive account");
  await redis.set(sessionKey(id), randomUUID(), "NX");
  const version = await redis.get(sessionKey(id));
  if (!version) throw new Error("Session store unavailable");
  const expected = payload as Partial<BaseTokenPayload>;
  if (expected.sessionVersion && expected.sessionVersion !== version) throw new Error("Session revoked");
  if (expected.credentialVersion && expected.credentialVersion !== credentialVersion(user.password)) throw new Error("Credentials changed");
  const duration = tokenType === "access" ? Math.min(timeToSeconds(expiresIn || "1h"), 3600) : timeToSeconds(expiresIn || "4h");
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("Invalid token lifetime");
  return new SignJWT({ ...payload, tokenType, sessionVersion: version, credentialVersion: credentialVersion(user.password) })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" }).setIssuedAt().setJti(randomUUID())
    .setExpirationTime(Math.floor(Date.now() / 1000) + duration).sign(getJwtSecret());
}
async function verifyByType<T extends BaseTokenPayload>(token: string, tokenType: TokenType): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: ["HS256"], requiredClaims: ["exp", "iat", "jti"] });
    if (payload.tokenType !== tokenType || !Number.isSafeInteger(payload.id) || Number(payload.id) <= 0 || typeof payload.sessionVersion !== "string") return null;
    const id = Number(payload.id);
    const [user, version] = await Promise.all([
      prisma.user.findUnique({ where: { id }, select: { accountId: true, nickName: true, password: true, refreshToken: true, status: true, isAdmin: true, userGroups: { select: { groupId: true } } } }),
      redis.get(sessionKey(id)),
    ]);
    if (!user || (user.status && user.status !== "active") || !version || version !== payload.sessionVersion) return null;
    if (payload.credentialVersion !== credentialVersion(user.password)) return null;
    if (tokenType === "refresh" && (!user.refreshToken || user.refreshToken !== hashRefreshToken(token))) return null;
    return { ...payload, id, accountId: user.accountId, nickName: user.nickName,
      isAdmin: Boolean(user.isAdmin), groups: user.userGroups.map(g => g.groupId) } as unknown as T;
  } catch {
    return null;
  }
}
export const sign = (payload: object, expiresIn = process.env.ACCESSTOKEN_EXPIRES_IN) => issue(payload, "access", expiresIn);
export const refresh = (payload: object, expiresIn = process.env.REFRESHTOKEN_EXPIRES_IN) => issue(payload, "refresh", expiresIn);
export const verify = (token: string) => verifyByType<BaseTokenPayload & { tokenType: "access" }>(token, "access");
export const refreshVerify = (token: string) => verifyByType<BaseTokenPayload & { tokenType: "refresh" }>(token, "refresh");
