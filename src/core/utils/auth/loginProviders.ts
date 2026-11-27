import "server-only";

import type { LoginProvider } from "@/core/registry/defineLoginProviders";
import { loginProviders as extensionLoginProviders } from "@extensions/loginProviders";
import { installedLoginProviders } from "@/packages/installedLoginProviders";
import socialLoginProviders from "@/modules/user/social/loginProviders";

// 로그인 뒤 돌아갈 경로를 수단의 주소에 쿼리로 붙인다. 같은 사이트 안의 경로가 아니면 붙이지 않는다.
const withRedirect = (href: string, redirect?: string) => {
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) return href;
  return `${href}${href.includes("?") ? "&" : "?"}redirect=${encodeURIComponent(redirect)}`;
};

// 코어의 소셜 로그인, 쉬운 설치 패키지, 프로젝트 확장이 등록한 로그인 수단을 이 순서로 모은다.
// 한 곳이 실패해도 로그인 화면은 열려야 하므로 그 수단만 빼고 나머지를 돌려준다.
// 돌려주는 href는 redirect가 이미 붙은 주소이므로 화면은 그대로 링크에 쓴다.
export async function getLoginProviders(redirect?: string): Promise<LoginProvider[]> {
  const providers = new Map<string, LoginProvider>();
  for (const source of [socialLoginProviders, ...installedLoginProviders, ...extensionLoginProviders]) {
    try {
      for (const provider of await source()) {
        // 같은 사이트 안의 경로만 받는다. 밖으로 나가는 주소를 로그인 버튼으로 내놓지 않는다.
        if (!provider.href.startsWith("/") || provider.href.startsWith("//")) continue;
        providers.delete(provider.key);
        providers.set(provider.key, provider);
      }
    } catch (error) {
      console.error("Login Provider Error:", error);
    }
  }
  return [...providers.values()].map((provider) => ({ ...provider, href: withRedirect(provider.href, redirect) }));
}
