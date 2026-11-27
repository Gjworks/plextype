import { NextRequest, NextResponse } from "next/server";

import { getProviderConfig } from "@/modules/user/social/config";
import { originFromHeaders, safeRedirectPath, saveState, STATE_COOKIE, STATE_COOKIE_PATH, STATE_TTL_SECONDS } from "@/modules/user/social/flow";
import { findProvider } from "@/modules/user/social/registry";
import { callbackUrl } from "@/modules/user/social/providers";
import { getLoggedUserAction } from "@/modules/user/actions/user.action";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// 제공자의 로그인 화면으로 보낸다.
// 쿼리: redirect(끝난 뒤 돌아갈 경로), mode=link(로그인한 회원의 계정에 연결).
export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }): Promise<Response> {
  const provider = findProvider((await params).provider);
  const origin = originFromHeaders(request.headers, request.nextUrl.origin);
  const fail = (code: string) => NextResponse.redirect(new URL(`/auth/social-login?code=${code}`, origin));

  if (!provider) return fail("unknown-provider");
  const config = await getProviderConfig(provider);
  if (!config) return fail("not-configured");

  const linking = request.nextUrl.searchParams.get("mode") === "link";
  const current = linking ? await getLoggedUserAction() : null;
  if (linking && !current?.id) return fail("login-required");

  const state = await saveState({
    provider: provider.key,
    mode: linking ? "link" : "login",
    redirect: safeRedirectPath(request.nextUrl.searchParams.get("redirect")),
    userId: current?.id || undefined,
  });

  const response = NextResponse.redirect(provider.authorizeUrl(config, { redirectUri: callbackUrl(origin, provider), state }));
  response.cookies.set({
    name: STATE_COOKIE,
    value: state,
    httpOnly: true,
    // 제공자에서 돌아오는 이동(다른 사이트에서 오는 GET)에도 쿠키가 실려야 하므로 lax로 둔다.
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: STATE_COOKIE_PATH,
    maxAge: STATE_TTL_SECONDS,
  });
  return response;
}
