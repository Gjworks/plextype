import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod"; // ✅ Zod 추가
import { verifyPassword } from "@/core/utils/auth/password";
import { issueLoginSession } from "@/core/utils/auth/loginSession";
import prisma from "@/core/utils/db/prisma";
import redisClient from "@/core/utils/redis/redis";
import { getAuthSettingsRuntimeAction } from "@/modules/user/actions/auth-settings";



// ✅ 1. 로그인 유효성 검사 스키마
const LoginSchema = z.object({
  accountId: z.string().min(1, { message: "계정 아이디를 입력해주세요." }),
  password: z.string().min(1, { message: "비밀번호를 입력해주세요." }),
  client: z.string().optional(),
});

const getClientIp = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  const rawIp = forwarded
    ? forwarded.split(",")[0].trim()
    : (request as any).ip || request.headers.get("x-real-ip") || "unknown";

  return rawIp.replace(/^::ffff:/, "");
};

const getLoginRateLimitKeys = (accountId: string, ip: string) => {
  const fingerprint = createHash("sha256")
    .update(accountId.trim().toLowerCase())
    .digest("hex");

  return {
    id: fingerprint,
    failKey: `login_fail:${fingerprint}`,
    lockKey: `login_lock:${fingerprint}`,
    lockMetaKey: `login_lock_meta:${fingerprint}`,
  };
};

const getLoginRateLimitStatus = async (accountId: string, ip: string, lockSeconds: number) => {
  try {
    const { lockKey } = getLoginRateLimitKeys(accountId, ip);
    const ttl = await redisClient.ttl(lockKey);

    return {
      locked: ttl > 0,
      retryAfter: ttl > 0 ? ttl : lockSeconds,
    };
  } catch (error) {
    console.error("Login RateLimit Check Error:", error);
    return { locked: true, retryAfter: lockSeconds };
  }
};

const recordLoginFailure = async (accountId: string, ip: string, failLimit: number, failWindowSeconds: number, lockSeconds: number) => {
  try {
    const { id, failKey, lockKey, lockMetaKey } = getLoginRateLimitKeys(accountId, ip);
    const failCount = Number(await redisClient.eval(`
      local count = redis.call('INCR', KEYS[1])
      if redis.call('TTL', KEYS[1]) < 0 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
      return count
    `, 1, failKey, failWindowSeconds));

    if (failCount >= failLimit) {
      const lockedAt = new Date();
      const expiresAt = new Date(lockedAt.getTime() + lockSeconds * 1000);
      await redisClient.set(lockKey, "1", "EX", lockSeconds);
      await redisClient.set(
        lockMetaKey,
        JSON.stringify({
          id,
          lockKey,
          accountId,
          ip,
          lockedAt: lockedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
        }),
        "EX",
        lockSeconds,
      );
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
      client: formData.get("client")?.toString(),
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

    const isMobileClient = validation.data.client === "mobile";
    const { accountId, password } = validation.data;
    const userIp = getClientIp(request);
    const authSettings = await getAuthSettingsRuntimeAction();
    const failWindowSeconds = authSettings.loginFailWindowMinutes * 60;
    const lockSeconds = authSettings.loginLockMinutes * 60;
    const rateLimitStatus = await getLoginRateLimitStatus(accountId, userIp, lockSeconds);

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
      await recordLoginFailure(accountId, userIp, authSettings.loginFailLimit, failWindowSeconds, lockSeconds);
      return NextResponse.json(loginFailResponse, { status: 401 });
    }

    // ✅ 4. 비밀번호 검증
    const isPasswordValid = await verifyPassword(password, userInfo.password);
    if (!isPasswordValid) {
      await recordLoginFailure(accountId, userIp, authSettings.loginFailLimit, failWindowSeconds, lockSeconds);
      return NextResponse.json(loginFailResponse, { status: 401 });
    }

    const userStatus = userInfo.status || "active";
    if (!userInfo.isAdmin && userStatus !== "active") {
      await clearLoginFailures(accountId, userIp);

      const statusMessage = userStatus === "pending"
        ? "관리자 승인 후 로그인할 수 있습니다."
        : "현재 사용할 수 없는 계정입니다.";

      return NextResponse.json({
        success: false,
        type: "error",
        message: statusMessage,
        fieldErrors: {
          accountId: statusMessage,
        },
      }, { status: 403 });
    }

    await clearLoginFailures(accountId, userIp);

    // ✅ 5. 응답 준비
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

    // ✅ 6. 세션 발급 (토큰, 쿠키, 접속 정보, 로그인 알림)
    await issueLoginSession(response, userInfo, {
      ip: userIp,
      notify: isMobileClient ? undefined : "web",
      refreshTokenExpiresIn: isMobileClient ? "365d" : undefined,
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
