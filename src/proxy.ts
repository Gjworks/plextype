import { NextRequest, NextResponse } from "next/server";
import redisClient from "@/core/utils/redis/redis";
import { verify } from "@/core/utils/auth/jwtAuth";
import { getExpiredAuthCookieOptions } from "@/core/utils/auth/authCookies";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken");

  // 1. [ 무조건 통과 ] 로그인, API, 정적 파일
  if (
    pathname.startsWith("/auth") || 
    pathname.startsWith("/api/auth") || 
    pathname.startsWith("/_next") || 
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  let decodeToken: { id: string; isAdmin: boolean } | null = null;
  if (accessToken?.value) {
    try {
      const verified = await verify(accessToken.value);
      decodeToken = verified
        ? { id: String(verified.id), isAdmin: Boolean(verified.isAdmin) }
        : null;
    } catch (e) {
      // 토큰 에러 시 무시 (아래 권한 체크에서 걸러짐)
    }
  }

  if (decodeToken?.id) {
    const userIp = getClientIp(request).replace(/^::ffff:/, "");
    const activeKey = `active_user:${decodeToken.id}:${userIp}`;

    try {
      // 1. Redis에 내 세션 키가 있는지 확인 (검문) ㅡㅡ+
      const isActive = await redisClient.exists(activeKey);

      // 2. 관리자가 내 키를 지웠다면 (isActive가 0이라면)
      if (!isActive && !pathname.startsWith("/auth")) {
        const response = NextResponse.redirect(new URL("/auth/signin?reason=kicked", request.url));
        response.cookies.set("accessToken", "", getExpiredAuthCookieOptions());
        response.cookies.set("refreshToken", "", getExpiredAuthCookieOptions());
        return response; // 🌟 여기서 바로 리턴해서 밑의 set 로직을 못 타게 막아야 합니다!
      }

      // 3. 키가 살아있다면? 접속 시간만 연장해줍니다 (Pulse)
      await redisClient.expire(activeKey, 300);
    } catch (error) {
      console.error("Proxy Redis Error:", error);
    }
  }

  // 3. [ 페이지 접근 권한 체크 ]
  if (pathname.startsWith("/admin")) {
    if (!decodeToken?.id) return NextResponse.redirect(new URL("/auth/signin", request.url));
    if (!decodeToken?.isAdmin) return NextResponse.redirect(new URL("/access", request.url));
  }
  if (pathname.startsWith("/user") && !decodeToken?.id) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  return NextResponse.next();
}

const getClientIp = (request: NextRequest) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return (request as any).ip || request.headers.get("x-real-ip") || "unknown";
};
