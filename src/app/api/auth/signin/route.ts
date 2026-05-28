import { NextResponse } from "next/server";
import { createHash } from "crypto";
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

const LOGIN_FAIL_LIMIT = 5;
const LOGIN_FAIL_WINDOW_SECONDS = 15 * 60;
const LOGIN_LOCK_SECONDS = 15 * 60;

const getClientIp = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  const rawIp = forwarded
    ? forwarded.split(",")[0].trim()
    : (request as any).ip || request.headers.get("x-real-ip") || "unknown";

  return rawIp.replace(/^::ffff:/, "");
};

const getLoginRateLimitKeys = (accountId: string, ip: string) => {
  const fingerprint = createHash("sha256")
    .update(`${ip}:${accountId.trim().toLowerCase()}`)
    .digest("hex");

  return {
    failKey: `login_fail:${fingerprint}`,
    lockKey: `login_lock:${fingerprint}`,
  };
};

const getLoginRateLimitStatus = async (accountId: string, ip: string) => {
  try {
    const { lockKey } = getLoginRateLimitKeys(accountId, ip);
    const ttl = await redisClient.ttl(lockKey);

    return {
      locked: ttl > 0,
      retryAfter: ttl > 0 ? ttl : LOGIN_LOCK_SECONDS,
    };
  } catch (error) {
    console.error("Login RateLimit Check Error:", error);
    return { locked: false, retryAfter: LOGIN_LOCK_SECONDS };
  }
};

const recordLoginFailure = async (accountId: string, ip: string) => {
  try {
    const { failKey, lockKey } = getLoginRateLimitKeys(accountId, ip);
    const failCount = await redisClient.incr(failKey);

    if (failCount === 1) {
      await redisClient.expire(failKey, LOGIN_FAIL_WINDOW_SECONDS);
    }

    if (failCount >= LOGIN_FAIL_LIMIT) {
      await redisClient.set(lockKey, "1", "EX", LOGIN_LOCK_SECONDS);
      await redisClient.del(failKey);
    }
  } catch (error) {
    console.error("Login RateLimit Record Error:", error);
  }
};

const clearLoginFailures = async (accountId: string, ip: string) => {
  try {
    const { failKey, lockKey } = getLoginRateLimitKeys(accountId, ip);
    await redisClient.del(failKey, lockKey);
  } catch (error) {
    console.error("Login RateLimit Clear Error:", error);
  }
};

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
    const userIp = getClientIp(request);
    const rateLimitStatus = await getLoginRateLimitStatus(accountId, userIp);

    if (rateLimitStatus.locked) {
      return NextResponse.json({
        success: false,
        type: "error",
        message: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.",
        fieldErrors: {
          accountId: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.",
        },
      }, {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitStatus.retryAfter),
        },
      });
    }

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
      await recordLoginFailure(accountId, userIp);
      return NextResponse.json(loginFailResponse, { status: 401 });
    }

    // ✅ 4. 비밀번호 검증
    const isPasswordValid = await verifyPassword(password, userInfo.password);
    if (!isPasswordValid) {
      await recordLoginFailure(accountId, userIp);
      return NextResponse.json(loginFailResponse, { status: 401 });
    }

    await clearLoginFailures(accountId, userIp);

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
