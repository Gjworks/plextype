import type { ProviderConfig, ProviderDefinition, ProviderField, SocialProfile } from "./types.ts";

// 제공자가 응답하지 않을 때 로그인 요청이 오래 붙잡히지 않게 하는 한도.
export const REQUEST_TIMEOUT_MS = 10_000;

export const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

export const CLIENT_ID_FIELD = (label = "클라이언트 ID"): ProviderField => ({ name: "clientId", label });
export const CLIENT_SECRET_FIELD = (label = "클라이언트 시크릿", required = true): ProviderField => ({
  name: "clientSecret", label, secret: true, required,
});

export async function readJson(response: Response) {
  return response.json().catch(() => null);
}

type OAuth2Options = Pick<ProviderDefinition, "key" | "label" | "brand" | "fields" | "guide"> & {
  authorizeEndpoint: string;
  tokenEndpoint: string;
  // 생략하면 scope를 보내지 않고 제공자 콘솔에 설정한 동의 항목을 그대로 쓴다.
  scope?: string;
  // 액세스 토큰으로 회원 정보를 읽는다. 읽지 못하면 null.
  loadProfile: (accessToken: string, fetcher: typeof fetch) => Promise<SocialProfile | null>;
};

// 인가 코드를 시크릿과 함께 토큰으로 바꾸고, 토큰으로 회원 정보를 읽는 표준 OAuth 2.0 흐름의 제공자를 만든다.
export function oauth2Provider(options: OAuth2Options): ProviderDefinition {
  const { authorizeEndpoint, tokenEndpoint, scope, loadProfile, ...definition } = options;
  return {
    ...definition,
    authorizeUrl: (config, input) => {
      const url = new URL(authorizeEndpoint);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", config.clientId);
      url.searchParams.set("redirect_uri", input.redirectUri);
      url.searchParams.set("state", input.state);
      if (scope) url.searchParams.set("scope", scope);
      return url.toString();
    },
    fetchProfile: async (config, input, fetcher) => {
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.clientId,
        redirect_uri: input.redirectUri,
        code: input.code,
        // 네이버는 토큰 요청에도 state를 받는다. 다른 제공자는 모르는 값을 무시한다.
        state: input.state,
      });
      if (config.clientSecret) body.set("client_secret", config.clientSecret);

      const tokenResponse = await fetcher(tokenEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8", Accept: "application/json" },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      const accessToken = text((await readJson(tokenResponse))?.access_token);
      if (!tokenResponse.ok || !accessToken) throw new Error(`${definition.key} 토큰 발급 실패 (${tokenResponse.status})`);

      const profile = await loadProfile(accessToken, fetcher);
      if (!profile) throw new Error(`${definition.key} 회원 정보 조회 실패`);
      return profile;
    },
  };
}

// 액세스 토큰을 실어 JSON을 읽는다. 응답이 실패면 null.
export async function getJson(url: string, accessToken: string, fetcher: typeof fetch, headers: Record<string, string> = {}) {
  const response = await fetcher(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json", ...headers },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  return response.ok ? readJson(response) : null;
}

export const requiredFields = (definition: ProviderDefinition) => definition.fields.filter((field) => field.required !== false);

// 필수 값이 모두 채워졌는지. 빠진 것이 있으면 로그인에 쓸 수 없다.
export const isComplete = (definition: ProviderDefinition, config: ProviderConfig) => (
  requiredFields(definition).every((field) => Boolean(text(config[field.name])))
);
