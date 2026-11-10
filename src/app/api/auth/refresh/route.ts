import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getAccessTokenCookieOptions, getExpiredAuthCookieOptions, getRefreshTokenCookieOptions } from "@/core/utils/auth/authCookies";
import { rotateRefreshSession } from "@/core/utils/auth/refreshSession";
import { getAuthSettingsRuntimeAction } from "@/modules/user/actions/auth-settings";

const failure = (status: number, code: string, message: string, clearCookies = true) => {
  const response = NextResponse.json({ success: false, code, type: "error", message, data: {} }, { status });
  if (clearCookies) {
    response.cookies.set("accessToken", "", getExpiredAuthCookieOptions());
    response.cookies.set("refreshToken", "", getExpiredAuthCookieOptions());
  }
  return response;
};

export async function POST(): Promise<Response> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  try {
    if (!refreshToken) return failure(401, "token_error", "refreshToken이 존재하지 않습니다.");

    const authSettings = await getAuthSettingsRuntimeAction();
    const result = await rotateRefreshSession(refreshToken, {
      accessTokenExpiresIn: authSettings.accessTokenExpiresIn,
      refreshTokenExpiresIn: authSettings.refreshTokenExpiresIn,
    });

    if (result.status === "invalid") return failure(401, "refreshToken_expires", "token이 만료되었습니다. 로그인을 새로 해주세요.");
    if (result.status === "inactive") return failure(403, "inactive_account", "현재 사용할 수 없는 계정입니다.");
    // 다른 요청이 같은 토큰을 회전하는 중이다. 쿠키를 그대로 두고 잠시 뒤 다시 요청하게 한다.
    if (result.status === "pending") return failure(503, "refresh_in_progress", "토큰을 갱신하는 중입니다. 잠시 후 다시 시도해주세요.", false);

    const response = NextResponse.json({
      success: true,
      code: "new_accessToken",
      type: "success",
      message: "토큰이 갱신되었습니다.",
      data: {},
    });
    response.cookies.set("accessToken", result.accessToken, getAccessTokenCookieOptions(authSettings.accessTokenExpiresIn));
    response.cookies.set("refreshToken", result.refreshToken, getRefreshTokenCookieOptions(authSettings.refreshTokenExpiresIn));
    return response;
  } catch {
    return failure(500, "server_error", "서버 오류가 발생했습니다.", false);
  }
}
