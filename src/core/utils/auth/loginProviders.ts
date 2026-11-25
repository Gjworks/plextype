import "server-only";

import type { LoginProvider } from "@/core/registry/defineLoginProviders";
import { loginProviders as extensionLoginProviders } from "@extensions/loginProviders";
import { installedLoginProviders } from "@/packages/installedLoginProviders";

// 쉬운 설치 패키지와 프로젝트 확장이 등록한 로그인 수단을 모은다.
// 한 곳이 실패해도 로그인 화면은 열려야 하므로 그 수단만 빼고 나머지를 돌려준다.
export async function getLoginProviders(): Promise<LoginProvider[]> {
  const providers = new Map<string, LoginProvider>();
  for (const source of [...installedLoginProviders, ...extensionLoginProviders]) {
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
  return [...providers.values()];
}
