import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<Response> {
  try {
    // 쿠키에서 accessToken, refreshToken을 가져와서 삭제
    const response = NextResponse.json({ message: "Logged out successfully" });

    // accessToken, refreshToken 쿠키 삭제
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");

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
