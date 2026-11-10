import { NextResponse, NextRequest } from "next/server";

import { verify } from "@/core/utils/auth/jwtAuth";
import { rotateRefreshSession } from "@/core/utils/auth/refreshSession";

import { findUserById } from "@/modules/user/actions/user.query";
import { getAccessTokenCookieOptions, getExpiredAuthCookieOptions, getRefreshTokenCookieOptions } from "@/core/utils/auth/authCookies";
import { getAuthSettingsRuntimeAction } from "@/modules/user/actions/auth-settings";
import { findUserPreferenceByUserId } from "@/modules/user/actions/preference.query";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;
    const authSettings = await getAuthSettingsRuntimeAction();

    let userId: number | null = null;
    let needsNewToken = false;

    // 1. Access Token 검증
    if (accessToken) {
      const decoded = await verify(accessToken);
      if (decoded) userId = decoded.id;
      else needsNewToken = true; // 만료됨
    } else {
      needsNewToken = true; // 토큰 없음
    }

    // 2. 토큰 갱신이 필요한 경우 Refresh Token 회전
    if (needsNewToken && refreshToken) {
      const result = await rotateRefreshSession(refreshToken, {
        accessTokenExpiresIn: authSettings.accessTokenExpiresIn,
        refreshTokenExpiresIn: authSettings.refreshTokenExpiresIn,
      });

      if (result.status === "pending") return NextResponse.json({ isLoggedIn: false, pending: true }, { status: 503 });
      if (result.status !== "rotated") return expiredSessionResponse();

      const user = await findUserById(result.userId);
      if (!user) return expiredSessionResponse();

      const response = NextResponse.json({
        isLoggedIn: true,
        ...(await formatUserResponse(user)),
      });
      response.cookies.set({
        name: "accessToken",
        value: result.accessToken,
        ...getAccessTokenCookieOptions(authSettings.accessTokenExpiresIn),
      });
      response.cookies.set({
        name: "refreshToken",
        value: result.refreshToken,
        ...getRefreshTokenCookieOptions(authSettings.refreshTokenExpiresIn),
      });
      return response;
    }

    // 3. 유저 정보 반환 (정상 로그인 상태)
    if (userId) {
      const user = await findUserById(userId);
      if (user) {
        if (!isUserAccountAvailable(user)) {
          return expiredSessionResponse();
        }

        return NextResponse.json({
          isLoggedIn: true,
          ...(await formatUserResponse(user))
        });
      }
    }

    // 4. 모든 검증 실패 시 쿠키 삭제 및 비로그인 반환
    return expiredSessionResponse();

  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function isUserAccountAvailable(user: any) {
  return Boolean(user.isAdmin) || !user.status || user.status === "active";
}

function expiredSessionResponse() {
  const response = NextResponse.json({ isLoggedIn: false });
  response.cookies.set("accessToken", "", getExpiredAuthCookieOptions());
  response.cookies.set("refreshToken", "", getExpiredAuthCookieOptions());
  return response;
}

// 헬퍼 함수: 응답 포맷 통일
async function formatUserResponse(user: any) {
  return {
    id: user.id,
    accountId: user.accountId,
    nickName: user.nickName,
    email_address: user.email_address,
    isAdmin: user.isAdmin,
    profile: user.profile,
    profileImage: user.profile?.profileImage || null,
    preferences: await findUserPreferenceByUserId(user.id),
  };
}
