import { NextResponse, NextRequest } from "next/server";

import { sign, verify, refreshVerify } from "@/core/utils/auth/jwtAuth";

import { findUserById } from "@/modules/user/actions/user.query";
import { timeToSeconds } from "@/core/utils/date/timeToSeconds";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

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

    // 2. 토큰 갱신이 필요한 경우 Refresh Token 확인
    if (needsNewToken && refreshToken) {
      const refreshDecoded = await refreshVerify(refreshToken);
      if (refreshDecoded) {
        userId = refreshDecoded.id;

        // 새로운 Access Token 발급 및 쿠키 설정 로직 진행
        const tokenParams = {
          id: refreshDecoded.id,
          accountId: refreshDecoded.accountId,
          isAdmin: refreshDecoded.isAdmin
        };
        const newAccessToken = await sign(tokenParams);
        const accessTokenExpire = timeToSeconds(process.env.ACCESSTOKEN_EXPIRES_IN || "1h");

        // 유저 정보 가져오기 (공통 로직으로 통합)
        const user = await findUserById(userId!);
        if (user) {
          const response = NextResponse.json({
            isLoggedIn: true,
            ...formatUserResponse(user) // 유저 정보 포맷팅
          });

          response.cookies.set({
            name: "accessToken",
            value: newAccessToken,
            httpOnly: true,
            sameSite: "strict",
            maxAge: accessTokenExpire,
          });
          return response;
        }
      }
    }

    // 3. 유저 정보 반환 (정상 로그인 상태)
    if (userId) {
      const user = await findUserById(userId);
      console.log(user)
      if (user) {
        return NextResponse.json({
          isLoggedIn: true,
          ...formatUserResponse(user)
        });
      }
    }

    // 4. 모든 검증 실패 시 쿠키 삭제 및 비로그인 반환
    const response = NextResponse.json({ isLoggedIn: false });
    response.cookies.set("accessToken", "", { maxAge: 0 });
    response.cookies.set("refreshToken", "", { maxAge: 0 });
    return response;

  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 헬퍼 함수: 응답 포맷 통일
function formatUserResponse(user: any) {
  return {
    id: user.id,
    accountId: user.accountId,
    nickName: user.nickName,
    email_address: user.email_address,
    isAdmin: user.isAdmin,
  };
}
