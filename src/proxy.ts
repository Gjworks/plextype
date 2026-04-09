import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "jose";

export const config = {
  // runtime: "nodejs",
};
// 미들웨어 생성
export async function proxy(request: NextRequest, response: NextResponse) {
  try {
    const { cookies } = request;
    const hasAccessToken = cookies.has("accessToken");
    const accessToken = cookies.get("accessToken");
    const { pathname } = request.nextUrl;
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

    let decodeToken: { id: string; isAdmin: boolean } | null = null;
    if (accessToken?.value) {
      decodeToken = (await decodeJwt(accessToken.value)) as {
        id: string;
        isAdmin: boolean;
      };
      if (
        !decodeToken?.isAdmin &&
        request.nextUrl.pathname.startsWith("/admin")
      ) {
        return NextResponse.redirect(new URL("/access", request.url));
      }
    }
    if (
      !hasAccessToken &&
      (request.nextUrl.pathname === "/user" ||
        request.nextUrl.pathname.startsWith("/user/"))
    ) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
    if (!hasAccessToken && request.nextUrl.pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

  } catch (error) {
    console.error("Error in middleware:", error);
    return NextResponse.error();
  }
  // return NextResponse.next();
}
