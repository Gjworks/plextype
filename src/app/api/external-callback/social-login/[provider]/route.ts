import { NextRequest, NextResponse } from "next/server";

import { originFromHeaders } from "@/modules/user/social/flow";
import { findProvider } from "@/modules/user/social/registry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// 인가 결과를 POST로 돌려주는 제공자(애플)의 리다이렉트 주소.
// 여기서는 아무것도 처리하지 않고 code와 state를 같은 사이트의 GET 콜백으로 넘긴다.
// 다른 사이트에서 온 POST에는 state 쿠키(SameSite=Lax)가 실리지 않지만, 이어지는 GET 이동에는 실린다.
// 확인과 로그인은 모두 GET 콜백이 한다. 이 주소는 출처 검사를 받지 않으므로 요청을 믿고 하는 일이 없어야 한다.
export async function POST(request: NextRequest, { params }: { params: Promise<{ provider: string }> }): Promise<Response> {
  const provider = findProvider((await params).provider);
  const origin = originFromHeaders(request.headers, request.nextUrl.origin);
  if (!provider || provider.callbackMethod !== "POST") {
    return NextResponse.redirect(new URL("/auth/social-login?code=unknown-provider", origin), 303);
  }

  const form = await request.formData().catch(() => null);
  const target = new URL(`/api/social-login/${provider.key}/callback`, origin);
  for (const name of ["code", "state"]) {
    const value = form?.get(name);
    if (typeof value === "string" && value) target.searchParams.set(name, value);
  }
  // 303: POST를 GET으로 바꿔 이동시킨다.
  return NextResponse.redirect(target, 303);
}
