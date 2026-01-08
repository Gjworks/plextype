import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod"; // ✅ Zod 추가
import { verifyPassword } from "@plextype/utils/auth/password";
import { sign, refresh } from "@plextype/utils/auth/jwtAuth";
import { PrismaClient } from "@prisma/client";
import { timeToSeconds } from "@plextype/utils/date/timeToSeconds";

const prisma = new PrismaClient();

// ✅ 1. 로그인 유효성 검사 스키마
const LoginSchema = z.object({
  accountId: z.string().min(1, { message: "계정 아이디를 입력해주세요." }),
  password: z.string().min(1, { message: "비밀번호를 입력해주세요." }),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const cookieStore = await cookies();
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
      groups: groupIds,
    };

    const [accessToken, refreshToken] = await Promise.all([
      sign(tokenParams),
      refresh(tokenParams),
    ]);

    // ✅ 7. 쿠키 설정 및 응답
    const accessTokenExpire = timeToSeconds(process.env.ACCESSTOKEN_EXPIRES_IN || "1h");
    const refreshTokenExpire = timeToSeconds(process.env.REFRESHTOKEN_EXPIRES_IN || "4h");

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

    // 쿠키 설정 옵션 공통화
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
    };

    response.cookies.set({
      name: "accessToken",
      value: accessToken,
      ...cookieOptions,
      maxAge: accessTokenExpire,
    });

    response.cookies.set({
      name: "refreshToken",
      value: refreshToken,
      ...cookieOptions,
      maxAge: refreshTokenExpire,
    });

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