import apple from "./apple.ts";
import facebook from "./facebook.ts";
import github from "./github.ts";
import google from "./google.ts";
import kakao from "./kakao.ts";
import naver from "./naver.ts";
import type { ProviderDefinition } from "./types.ts";

// 제공자 정의를 만드는 쪽(코어, 쉬운 설치 패키지, 프로젝트 확장)이 쓰는 것. 추가하는 방법은 ../README.md의 `제공자 추가`를 본다.
export { CLIENT_ID_FIELD, CLIENT_SECRET_FIELD, getJson, isComplete, oauth2Provider, readJson, REQUEST_TIMEOUT_MS, requiredFields, text } from "./oauth2.ts";
export type { AuthorizeInput, ExchangeInput, ProviderConfig, ProviderDefinition, ProviderField, ProviderGuide, ProviderLogo, SocialProfile } from "./types.ts";

// 코어가 기본으로 제공하는 제공자. 설정 화면과 로그인 버튼이 이 순서로 나온다.
export const BUILT_IN_PROVIDERS: ProviderDefinition[] = [kakao, naver, google, apple, github, facebook];

// 패키지 루트의 socialProviders.ts와 프로젝트의 src/extensions/socialProviders.ts가 제공자 목록을 내놓을 때 쓴다.
export const defineSocialProviders = (providers: ProviderDefinition[]) => providers;

// key는 주소(/api/social-login/<key>/...)와 설정 키, 연결 테이블의 provider 컬럼(32자)에 그대로 들어간다.
export const PROVIDER_KEY_PATTERN = /^[a-z0-9][a-z0-9-]{0,31}$/;

const usable = (provider: ProviderDefinition) => (
  Boolean(provider)
  && typeof provider.key === "string" && PROVIDER_KEY_PATTERN.test(provider.key)
  && Array.isArray(provider.fields)
  && typeof provider.authorizeUrl === "function" && typeof provider.fetchProfile === "function"
);

// 여러 곳의 제공자 목록을 하나로 합친다. 같은 key는 뒤의 목록이 앞의 것을 대신하되 자리는 앞의 것을 따른다.
// 쓸 수 없는 정의는 그것만 빼고 알린다. 하나가 잘못되어도 다른 제공자의 로그인은 열려 있어야 한다.
export function mergeProviders(...lists: ProviderDefinition[][]): ProviderDefinition[] {
  const merged = new Map<string, ProviderDefinition>();
  for (const provider of lists.flat()) {
    if (!usable(provider)) {
      console.error(`Social Login Provider Error: 쓸 수 없는 제공자 정의를 건너뜁니다 (${String(provider?.key)}).`);
      continue;
    }
    merged.set(provider.key, provider);
  }
  return [...merged.values()];
}

// 제공자 콘솔에 등록해야 하는 리다이렉트 주소.
// POST로 돌아오는 제공자는 코어가 다른 사이트의 POST를 받아 주는 /api/external-callback 아래 주소를 쓴다.
export const callbackUrl = (origin: string, provider: ProviderDefinition) => (
  provider.callbackMethod === "POST"
    ? `${origin}/api/external-callback/social-login/${provider.key}`
    : `${origin}/api/social-login/${provider.key}/callback`
);
