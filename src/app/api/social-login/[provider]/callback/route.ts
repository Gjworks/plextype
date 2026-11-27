import { NextRequest, NextResponse } from "next/server";

import { issueLoginSession } from "@/core/utils/auth/loginSession";
import { completeSocialLogin } from "@/modules/user/social/complete";
import { getProviderConfig } from "@/modules/user/social/config";
import { clientIp, consumeState, originFromHeaders, STATE_COOKIE, STATE_COOKIE_PATH } from "@/modules/user/social/flow";
import { findProvider } from "@/modules/user/social/registry";
import { callbackUrl, type SocialProfile } from "@/modules/user/social/providers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// 제공자에서 돌아온 요청을 확인하고 로그인·가입·계정 연결을 끝낸다.
export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }): Promise<Response> {
  const provider = findProvider((await params).provider);
  const origin = originFromHeaders(request.headers, request.nextUrl.origin);
  const leave = (path: string) => {
    const response = NextResponse.redirect(new URL(path, origin));
    response.cookies.set({ name: STATE_COOKIE, value: "", path: STATE_COOKIE_PATH, maxAge: 0 });
    return response;
  };
  const fail = (code: string) => leave(`/auth/social-login?code=${code}`);

  if (!provider) return fail("unknown-provider");
  const config = await getProviderConfig(provider);
  if (!config) return fail("not-configured");

  const query = request.nextUrl.searchParams;
  const state = query.get("state");
  if (!state || state !== request.cookies.get(STATE_COOKIE)?.value) return fail("invalid-state");
  const saved = await consumeState(state);
  if (!saved || saved.provider !== provider.key) return fail("invalid-state");

  // 회원이 제공자 화면에서 취소하면 code 없이 error만 돌아온다.
  const code = query.get("code");
  if (!code) return fail("cancelled");

  let profile: SocialProfile;
  try {
    profile = await provider.fetchProfile(config, { code, redirectUri: callbackUrl(origin, provider), state }, fetch);
  } catch (error) {
    console.error("Social Login Provider Error:", error);
    return fail("provider-error");
  }

  try {
    const outcome = await completeSocialLogin(provider, profile, saved);
    if (outcome.type === "error") return fail(outcome.code);
    if (outcome.type === "redirect") return leave(outcome.path);

    const response = leave(outcome.redirect);
    await issueLoginSession(response, outcome.user, { ip: clientIp(request.headers), source: `social:${provider.key}`, notify: "web" });
    return response;
  } catch (error) {
    console.error("Social Login Error:", error);
    return fail("signup-failed");
  }
}
