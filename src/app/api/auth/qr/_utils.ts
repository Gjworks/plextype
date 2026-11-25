import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { refreshVerify, verify } from "@/core/utils/auth/jwtAuth";
import { issueLoginSession } from "@/core/utils/auth/loginSession";
import { hashRefreshToken } from "@/core/utils/auth/refreshToken";
import prisma from "@/core/utils/db/prisma";
import redisClient from "@/core/utils/redis/redis";

export const QR_LOGIN_TTL_SECONDS = 150;

export type QrLoginSession = {
  nonce: string;
  status: "pending" | "approved";
  createdAt: string;
  expiresAt: string;
  approvedAt?: string;
  userId?: number;
};

export const getQrLoginKey = (sessionId: string) => `auth_qr:${sessionId}`;

export const createRandomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

export const readQrLoginSession = async (sessionId: string) => {
  const raw = await redisClient.get(getQrLoginKey(sessionId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as QrLoginSession;
  } catch {
    await redisClient.del(getQrLoginKey(sessionId));
    return null;
  }
};

export const writeQrLoginSession = async (sessionId: string, session: QrLoginSession, ttlSeconds = QR_LOGIN_TTL_SECONDS) => {
  await redisClient.set(getQrLoginKey(sessionId), JSON.stringify(session), "EX", ttlSeconds);
};

export const getClientIp = (request: NextRequest | Request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  const rawIp = forwarded
    ? forwarded.split(",")[0].trim()
    : (request as any).ip || request.headers.get("x-real-ip") || "unknown";

  return rawIp.replace(/^::ffff:/, "");
};

export const getAuthenticatedQrUser = async (request: NextRequest) => {
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  const accessDecoded = accessToken ? await verify(accessToken) : null;
  const refreshDecoded = !accessDecoded && refreshToken ? await refreshVerify(refreshToken) : null;
  const userId = accessDecoded?.id || refreshDecoded?.id;

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userGroups: { select: { groupId: true } } },
  });

  if (!user) return null;

  if (!accessDecoded) {
    const refreshTokenHash = refreshToken ? hashRefreshToken(refreshToken) : null;
    if (!refreshTokenHash || user.refreshToken !== refreshTokenHash) return null;
  }

  if (!user.isAdmin && user.status && user.status !== "active") return null;

  return user;
};

export const setQrLoginCookies = async (request: NextRequest, userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userGroups: { select: { groupId: true } } },
  });

  if (!user) return null;
  if (!user.isAdmin && user.status && user.status !== "active") return null;

  const response = NextResponse.json({
    success: true,
    status: "approved",
    user: {
      id: user.id,
      accountId: user.accountId,
      nickName: user.nickName,
      isAdmin: user.isAdmin,
    },
  });

  await issueLoginSession(response, user, { ip: getClientIp(request), source: "qr", notify: "qr" });

  return response;
};
