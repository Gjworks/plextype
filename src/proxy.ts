import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "jose";
import redisClient from "@/core/utils/redis/redis";

export async function proxy(request: NextRequest) {
  try {
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
        decodeToken = decodeJwt(accessToken.value) as any;
      } catch (e) {
        // 토큰 에러 시 무시 (아래 권한 체크에서 걸러짐)
      }
    }

    if (decodeToken?.id) {
      const userIp = getClientIp(request).replace(/^::ffff:/, "");
      const activeKey = `active_user:${decodeToken.id}:${userIp}`;

      // 1. Redis에 내 세션 키가 있는지 확인 (검문) ㅡㅡ+
      const isActive = await redisClient.exists(activeKey);

      // 2. 관리자가 내 키를 지웠다면 (isActive가 0이라면)
      if (!isActive && !pathname.startsWith("/auth")) {
        const response = NextResponse.redirect(new URL("/auth/signin?reason=kicked", request.url));
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");
        return response; // 🌟 여기서 바로 리턴해서 밑의 set 로직을 못 타게 막아야 합니다!
      }

      // 3. 키가 살아있다면? 접속 시간만 연장해줍니다 (Pulse)
      console.log("미들웨어가 세션 확인 및 갱신:", activeKey);
      await redisClient.expire(activeKey, 300);
    }

    // 3. [ 페이지 접근 권한 체크 ]
    const hasAccessToken = !!accessToken;
    if (pathname.startsWith("/admin")) {
      if (!hasAccessToken) return NextResponse.redirect(new URL("/auth/signin", request.url));
      if (!decodeToken?.isAdmin) return NextResponse.redirect(new URL("/access", request.url));
    }
    if (pathname.startsWith("/user") && !hasAccessToken) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware Error:", error);
    return NextResponse.next();
  }
}

const getClientIp = (request: NextRequest) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return (request as any).ip || request.headers.get("x-real-ip") || "unknown";
};