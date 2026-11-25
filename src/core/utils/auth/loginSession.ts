import type { NextResponse } from "next/server";

import { refresh, revokeUserSessions, sign } from "@/core/utils/auth/jwtAuth";
import { getAccessTokenCookieOptions, getRefreshTokenCookieOptions } from "@/core/utils/auth/authCookies";
import { hashRefreshToken } from "@/core/utils/auth/refreshToken";
import prisma from "@/core/utils/db/prisma";
import redisClient from "@/core/utils/redis/redis";
import { getAuthSettingsRuntimeAction } from "@/modules/user/actions/auth-settings";
import { createLoginNotificationAction } from "@/modules/notification/actions/notification.action";

export type LoginSessionUser = {
  id: number;
  accountId: string;
  nickName: string;
  isAdmin: boolean | null;
};

export type LoginSessionOptions = {
  // 접속 정보(active_user)를 구분하는 값. proxy가 같은 IP로 접속 유지 시간을 늘린다.
  ip: string;
  // 접속 정보에 남길 로그인 경로(예: "qr"). 생략하면 남기지 않는다.
  source?: string;
  // 로그인 알림에 적을 경로. 생략하면 알림을 보내지 않는다.
  notify?: "web" | "mobile" | "qr";
  // 인증 설정의 값 대신 쓸 리프레시 토큰 수명. 모바일 앱처럼 오래 유지해야 하는 클라이언트가 넘긴다.
  refreshTokenExpiresIn?: string;
};

// 본인 확인이 끝난 회원에게 로그인 세션을 발급한다. 비밀번호·QR·패키지의 로그인 수단이 모두 이 함수를 쓴다.
// 토큰 발급, 리프레시 토큰 저장, 쿠키 설정, 접속 정보 기록, 로그인 알림을 한 곳에서 해 로그인 경로마다 동작이 갈리지 않게 한다.
// 회원 상태(승인 대기·차단) 검사는 하지 않는다. 부르는 쪽이 먼저 걸러야 한다.
export async function issueLoginSession(response: NextResponse, user: LoginSessionUser, options: LoginSessionOptions) {
  const [authSettings, userGroups] = await Promise.all([
    getAuthSettingsRuntimeAction(),
    prisma.userGroupUser.findMany({ where: { userId: user.id }, select: { groupId: true } }),
  ]);
  const tokenParams = {
    id: user.id,
    accountId: user.accountId,
    isAdmin: user.isAdmin,
    nickName: user.nickName,
    groups: userGroups.map((group) => group.groupId),
  };
  const accessTokenExpiresIn = authSettings.accessTokenExpiresIn;
  const refreshTokenExpiresIn = options.refreshTokenExpiresIn ?? authSettings.refreshTokenExpiresIn;

  if (!authSettings.allowConcurrentSessions) await revokeUserSessions(user.id);
  const [accessToken, refreshToken] = await Promise.all([
    sign(tokenParams, accessTokenExpiresIn),
    refresh(tokenParams, refreshTokenExpiresIn),
  ]);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: hashRefreshToken(refreshToken) },
  });

  response.cookies.set({
    name: "accessToken",
    value: accessToken,
    ...getAccessTokenCookieOptions(accessTokenExpiresIn),
  });
  response.cookies.set({
    name: "refreshToken",
    value: refreshToken,
    ...getRefreshTokenCookieOptions(refreshTokenExpiresIn),
  });

  // Redis가 내려가 있어도 로그인은 끝낸다. 접속 정보와 프로필 캐시는 없어도 다시 만들어진다.
  try {
    if (!authSettings.allowConcurrentSessions) {
      const existingKeys = await redisClient.keys(`active_user:${user.id}:*`);
      if (existingKeys.length > 0) await redisClient.del(...existingKeys);
    }

    const loginAt = new Date().toISOString();
    await redisClient.set(
      `active_user:${user.id}:${options.ip}`,
      JSON.stringify(options.source ? { loginAt, source: options.source } : { loginAt }),
      "EX",
      300,
    );
    await redisClient.set(
      `user:profile:${user.id}`,
      JSON.stringify({ nickName: user.nickName, accountId: user.accountId }),
      "EX",
      86400,
    );
  } catch (redisError) {
    console.error("Login Redis Cache Error:", redisError);
  }

  if (options.notify) {
    createLoginNotificationAction({ userId: user.id, source: options.notify }).catch((error) => {
      console.error("Login Notification Error:", error);
    });
  }
}
