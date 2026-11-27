import { createSign } from "node:crypto";

import { readJson, REQUEST_TIMEOUT_MS, text } from "./oauth2.ts";
import type { ProviderConfig, ProviderDefinition } from "./types.ts";

// 애플은 고정된 시크릿 대신, 키 파일(.p8)로 서명한 짧은 수명의 JWT를 시크릿으로 받는다. 요청마다 새로 만든다.
const CLIENT_SECRET_TTL_SECONDS = 300;
const AUDIENCE = "https://appleid.apple.com";

const base64url = (value: string | Buffer) => Buffer.from(value).toString("base64url");

export function appleClientSecret(config: ProviderConfig, now = Math.floor(Date.now() / 1000)) {
  const header = base64url(JSON.stringify({ alg: "ES256", kid: config.keyId }));
  const payload = base64url(JSON.stringify({
    iss: config.teamId, iat: now, exp: now + CLIENT_SECRET_TTL_SECONDS, aud: AUDIENCE, sub: config.clientId,
  }));
  // JWT의 ES256 서명은 DER이 아니라 r과 s를 이어 붙인 형식이다.
  const signature = createSign("SHA256").update(`${header}.${payload}`).sign({ key: config.privateKey, dsaEncoding: "ieee-p1363" });
  return `${header}.${payload}.${base64url(signature)}`;
}

// 토큰 응답의 id_token에서 회원 정보를 읽는다. 애플의 토큰 주소에서 TLS로 직접 받은 값이라 서명은 다시 확인하지 않는다.
function readIdToken(idToken: string) {
  try { return JSON.parse(Buffer.from(idToken.split(".")[1] ?? "", "base64url").toString("utf8")); }
  catch { return null; }
}

const apple: ProviderDefinition = {
  key: "apple",
  label: "애플",
  brand: { background: "#000000", color: "#FFFFFF" },
  fields: [
    { name: "clientId", label: "Services ID", placeholder: "com.example.signin" },
    { name: "teamId", label: "Team ID" },
    { name: "keyId", label: "Key ID" },
    { name: "privateKey", label: "키 파일(.p8) 내용", secret: true, multiline: true, placeholder: "-----BEGIN PRIVATE KEY-----" },
  ],
  guide: {
    consoleName: "Apple Developer",
    consoleUrl: "https://developer.apple.com/account/resources/identifiers/list/serviceId",
    steps: [
      "Apple Developer Program에 가입된 계정이 필요합니다. Team ID는 멤버십 정보에 있습니다.",
      "Identifiers에서 App ID를 만들고 Sign in with Apple을 켭니다.",
      "Services ID를 만들고 Sign in with Apple을 켠 뒤, 도메인과 Return URL(아래 주소)을 등록합니다. https 주소만 받습니다.",
      "Keys에서 Sign in with Apple용 키를 만들어 .p8 파일을 받습니다. Key ID와 파일 내용 전체를 넣습니다.",
    ],
  },
  // 이름과 이메일을 요청하면 애플은 결과를 POST로 돌려준다.
  callbackMethod: "POST",
  authorizeUrl: (config, input) => {
    const url = new URL("https://appleid.apple.com/auth/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("response_mode", "form_post");
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", input.redirectUri);
    url.searchParams.set("state", input.state);
    url.searchParams.set("scope", "name email");
    return url.toString();
  },
  fetchProfile: async (config, input, fetcher) => {
    const response = await fetcher("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.clientId,
        client_secret: appleClientSecret(config),
        redirect_uri: input.redirectUri,
        code: input.code,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const idToken = text((await readJson(response))?.id_token);
    if (!response.ok || !idToken) throw new Error(`apple 토큰 발급 실패 (${response.status})`);

    const claims = readIdToken(idToken);
    if (!text(claims?.sub)) throw new Error("apple 회원 정보 조회 실패");
    // email_verified는 문자열 "true"로 올 때도 있다. 이름은 id_token에 없어 닉네임은 기본값으로 만든다.
    const verified = claims.email_verified === true || claims.email_verified === "true";
    return { id: claims.sub, email: verified ? text(claims.email) : null, name: null };
  },
};

export default apple;
