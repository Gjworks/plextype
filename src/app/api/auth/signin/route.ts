import { NextResponse } from "next/server";
import { z } from "zod"; // ✅ Zod 추가
import { verifyPassword } from "@/core/utils/auth/password";
import { sign, refresh } from "@/core/utils/auth/jwtAuth";
import prisma from "@/core/utils/db/prisma";
import redisClient from "@/core/utils/redis/redis";
import { getAccessTokenCookieOptions, getRefreshTokenCookieOptions } from "@/core/utils/auth/authCookies";
import { hashRefreshToken } from "@/core/utils/auth/refreshToken";



// ✅ 1. 로그인 유효성 검사 스키마
const LoginSchema = z.object({
  accountId: z.string().min(1, { message: "계정 아이디를 입력해주세요." }),
  password: z.string().min(1, { message: "비밀번호를 입력해주세요." }),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();

    // FormData를 객체로 변환
    const rawData = {
      accountId: formData.get("accountId")?.toString(),
      password: formData.get("password")?.toString(),
    };

    // ✅ 2. Zod 유효성 검사
    const validation = LoginSchema.safeParse(rawData);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json({
        success: false, // 에러이므로 false로 수정
        type: "error",
        element: firstError.path[0], // 어떤 필드에서 에러났는지 (accountId 등)
        message: firstError.message,
        fieldErrors: {
          [firstError.path[0] as string]: firstError.message,
        },
      }, { status: 400 });
    }

    const { accountId, password } = validation.data;

    // ✅ 3. 사용자 조회
    const userInfo = await prisma.user.findUnique({
      where: { accountId },
    });

    // 보안을 위해 "아이디 없음"과 "비밀번호 틀림"의 메시지를 동일하게 처리합니다.
    const loginFailResponse = {
      success: false,
      type: "error",
      message: "아이디 혹은 비밀번호가 일치하지 않습니다.",
      fieldErrors: {
        accountId: "아이디 혹은 비밀번호가 일치하지 않습니다.",
      },
    };

    if (!userInfo) {
      return NextResponse.json(loginFailResponse, { status: 401 });
    }

    // ✅ 4. 비밀번호 검증
    const isPasswordValid = await verifyPassword(password, userInfo.password);
    if (!isPasswordValid) {
      return NextResponse.json(loginFailResponse, { status: 401 });
    }

    // ✅ 5. 권한(그룹) 정보 가져오기
    const userGroups = await prisma.userGroupUser.findMany({
      where: { userId: userInfo.id },
      select: { groupId: true },
    });
    const groupIds = userGroups.map((g) => g.groupId);

    // ✅ 6. 토큰 발행
    const tokenParams = {
      id: userInfo.id,
      accountId: userInfo.accountId,
      isAdmin: userInfo.isAdmin,
      nickName: userInfo.nickName,
      groups: groupIds,
    };

    const [accessToken, refreshToken] = await Promise.all([
      sign(tokenParams),
      refresh(tokenParams),
    ]);

    await prisma.user.update({
      where: { id: userInfo.id },
      data: { refreshToken: hashRefreshToken(refreshToken) },
    });

    // ✅ 7. 쿠키 설정 및 응답
    const response = NextResponse.json({
      success: true,
      type: "success",
      data: {
        // 보안상 비밀번호는 제외하고 전달
        userInfo: {
          id: userInfo.id,
          accountId: userInfo.accountId,
          nickName: userInfo.nickName,
          isAdmin: userInfo.isAdmin
        },
      },
    });

    response.cookies.set({
      name: "accessToken",
      value: accessToken,
      ...getAccessTokenCookieOptions(),
    });

    response.cookies.set({
      name: "refreshToken",
      value: refreshToken,
      ...getRefreshTokenCookieOptions(),
    });

    const forwarded = request.headers.get("x-forwarded-for");
    const rawIp = forwarded 
      ? forwarded.split(",")[0].trim() 
      : (request as any).ip || request.headers.get("x-real-ip") || "unknown";

    // 2. IP 세척 (::ffff: 제거)
    const userIp = rawIp.replace(/^::ffff:/, "");
    const loginAt = new Date().toISOString();
    try {
      // 3. Redis에 실시간 접속 정보 저장 (미들웨어 검문 통과용)
      await redisClient.set(
        `active_user:${userInfo.id}:${userIp}`, 
        JSON.stringify({ loginAt }),
        "EX", 
        300
      );

      // 4. 기존 유저 프로필 캐시 저장 (있으시면 유지)
      await redisClient.set(
        `user:profile:${userInfo.id}`, 
        JSON.stringify({ 
          nickName: userInfo.nickName, 
          accountId: userInfo.accountId 
        }), 
        "EX", 
        86400
      );
    } catch (redisError) {
      console.error("Login Redis Cache Error:", redisError);
    }

    return response;

  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({
      success: false,
      type: "error",
      message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    }, { status: 500 });
  }
}
