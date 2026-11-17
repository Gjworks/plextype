import { NextRequest, NextResponse } from "next/server";

import { verify } from "@/core/utils/auth/jwtAuth";
import redisClient from "@/core/utils/redis/redis";

export type ProxySession = { id: string; isAdmin: boolean };

export type ProxyExtensionContext = {
  // accessToken 쿠키를 코어와 같은 방법으로 검증한 결과. 비로그인·만료·차단 회원은 null.
  // 한 요청에서 여러 번 불러도 검증은 한 번만 한다.
  getSession: () => Promise<ProxySession | null>;
};

// 응답을 돌려주면 그 응답으로 요청이 끝나고, 아무것도 돌려주지 않으면 코어가 요청을 통과시킨다.
export type ProxyExtension = (
  request: NextRequest,
  context: ProxyExtensionContext,
) => Response | null | undefined | void | Promise<Response | null | undefined | void>;

// 코어 검사(업로드 rewrite, 출처 검사, /admin·/user 접근 제어)를 모두 통과한 요청만 확장에 넘긴다.
// 확장은 요청을 더 막거나 다른 곳으로 보낼 수 있지만 코어가 막은 요청을 되살릴 수는 없다.
export const createProxy = (extension?: ProxyExtension | null) => async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/storage/uploads/")) {
    const target = request.nextUrl.clone();
    target.pathname = `/api${pathname}`;
    return NextResponse.rewrite(target);
  }

  if (
    isStateChangingRequest(request)
    && !isTrustedInternalRequest(request)
    && !isSameOriginRequest(request)
  ) {
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  }

  let sessionPromise: Promise<ProxySession | null> | undefined;
  const getSession = () => (sessionPromise ??= readSession(request));

  // 로그인 화면과 인증 API, 빌드 자산은 코어가 세션을 확인하지 않고 통과시킨다.
  const skipsCoreAccessCheck = pathname.startsWith("/auth")
    || pathname.startsWith("/api/auth")
    || pathname.startsWith("/_next");

  if (!skipsCoreAccessCheck) {
    const session = await getSession();

    if (session) {
      const userIp = getClientIp(request).replace(/^::ffff:/, "");
      const activeKey = `active_user:${session.id}:${userIp}`;

      try {
        await redisClient.expire(activeKey, 300);
      } catch (error) {
        console.error("Proxy Redis Error:", error);
      }
    }

    if (pathname.startsWith("/admin")) {
      if (!session) return NextResponse.redirect(new URL("/auth/signin", request.url));
      if (!session.isAdmin) return NextResponse.redirect(new URL("/access", request.url));
    }

    if (pathname.startsWith("/user") && !session) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
  }

  // /_next 자산 요청은 화면 하나에 수십 번 오므로 확장을 부르지 않는다.
  if (extension && !pathname.startsWith("/_next")) {
    const response = await extension(request, { getSession });
    if (response) return response;
  }

  return NextResponse.next();
};

export const proxy = createProxy();

const readSession = async (request: NextRequest): Promise<ProxySession | null> => {
  const accessToken = request.cookies.get("accessToken")?.value;
  if (!accessToken) return null;

  try {
    const verified = await verify(accessToken);
    return verified?.id
      ? { id: String(verified.id), isAdmin: Boolean(verified.isAdmin) }
      : null;
  } catch {
    // 검증 오류는 비로그인으로 취급하고, 접근 제어가 로그인 화면으로 보낸다.
    return null;
  }
};

const getClientIp = (request: NextRequest) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return (request as any).ip || request.headers.get("x-real-ip") || "unknown";
};

const CSRF_PROTECTED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const isStateChangingRequest = (request: NextRequest) => {
  return CSRF_PROTECTED_METHODS.has(request.method.toUpperCase());
};

const isTrustedInternalRequest = (request: NextRequest) => {
  return request.nextUrl.pathname === "/api/internal/service-deploy/notify";
};

const isSameOriginRequest = (request: NextRequest) => {
  const sourceOrigin = getHeaderOrigin(request.headers.get("origin"))
    ?? getHeaderOrigin(request.headers.get("referer"));

  if (!sourceOrigin) return false;

  return getAllowedOrigins(request).has(sourceOrigin);
};

const getAllowedOrigins = (request: NextRequest) => {
  const origins = new Set<string>([request.nextUrl.origin]);
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");

  if (host) {
    origins.add(`${forwardedProto || request.nextUrl.protocol.replace(":", "")}://${host}`);
  }

  const defaultUrlOrigin = getHeaderOrigin(process.env.NEXT_PUBLIC_DEFAULT_URL ?? null);
  if (defaultUrlOrigin) origins.add(defaultUrlOrigin);

  return origins;
};

const getHeaderOrigin = (value: string | null) => {
  if (!value || value === "null") return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};
