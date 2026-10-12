import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { refreshVerify, verify, revokeUserSessions } from "@/core/utils/auth/jwtAuth";
import { getExpiredAuthCookieOptions } from "@/core/utils/auth/authCookies";

export async function POST(): Promise<Response> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    const refreshToken = cookieStore.get("refreshToken")?.value;
    const verified = accessToken ? await verify(accessToken) : null;
    const refreshVerified = !verified && refreshToken ? await refreshVerify(refreshToken) : null;
    const userId = verified?.id || refreshVerified?.id;

    if (userId) await revokeUserSessions(userId);

    // 쿠키에서 accessToken, refreshToken을 가져와서 삭제
    const response = NextResponse.json({ message: "Logged out successfully" });

    // accessToken, refreshToken 쿠키 삭제
    response.cookies.set("accessToken", "", getExpiredAuthCookieOptions());
    response.cookies.set("refreshToken", "", getExpiredAuthCookieOptions());

    // 로그아웃 후 응답 반환
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Server error during logout" },
      { status: 500 },
    );
  }
}
