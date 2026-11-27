import { createHash, randomBytes } from "node:crypto";

import redisClient from "@/core/utils/redis/redis";

// 인가 요청을 보낸 브라우저와 돌아온 브라우저가 같은지 확인하는 쿠키.
// 없으면 공격자가 자기 계정으로 만든 콜백 주소를 피해자에게 열게 해 공격자 계정으로 로그인시킬 수 있다.
export const STATE_COOKIE = "social_login_state";
// 쿠키는 소셜 로그인의 라우트에만 보낸다.
export const STATE_COOKIE_PATH = "/api/social-login";
// 제공자 화면에서 로그인과 동의를 마치는 데 주는 시간.
export const STATE_TTL_SECONDS = 600;

export type SocialLoginState = {
  // 제공자의 key.
  provider: string;
  // login: 로그인 또는 가입. link: 로그인한 회원의 계정에 연결.
  mode: "login" | "link";
  // 끝난 뒤 돌아갈 사이트 안의 경로.
  redirect: string;
  // link일 때 연결을 시작한 회원. 돌아왔을 때의 로그인 회원과 같아야 한다.
  userId?: number;
};

const stateKey = (state: string) => `social_login:state:${state}`;

export async function saveState(value: SocialLoginState) {
  const state = randomBytes(24).toString("base64url");
  await redisClient.set(stateKey(state), JSON.stringify(value), "EX", STATE_TTL_SECONDS);
  return state;
}

// 한 번 쓴 state는 지운다. 같은 콜백 주소를 다시 열어도 통과하지 않는다.
export async function consumeState(state: string): Promise<SocialLoginState | null> {
  const raw = await redisClient.get(stateKey(state));
  if (!raw) return null;
  await redisClient.del(stateKey(state));
  try { return JSON.parse(raw) as SocialLoginState; }
  catch { return null; }
}

// 사이트 밖으로 보내는 주소는 받지 않는다.
export const safeRedirectPath = (value: string | null | undefined, fallback = "/") => (
  value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : fallback
);

// 방문자가 보는 주소의 origin. 프록시 뒤에서는 요청 URL이 내부 주소이므로 전달된 헤더를 먼저 본다.
// 제공자 콘솔에 등록한 리다이렉트 주소와 글자까지 같아야 하므로, 시작과 콜백에서 같은 방법으로 구한다.
export function originFromHeaders(headers: Headers, fallback: string) {
  const host = headers.get("x-forwarded-host")?.split(",")[0]?.trim() || headers.get("host");
  if (!host) return fallback;
  const proto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || new URL(fallback).protocol.replace(":", "");
  return `${proto}://${host}`;
}

// 비밀번호 로그인 API·proxy와 같은 방법으로 구한다. 접속 정보(active_user)의 키가 서로 맞아야 한다.
export function clientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  const raw = forwarded ? forwarded.split(",")[0].trim() : headers.get("x-real-ip") || "unknown";
  return raw.replace(/^::ffff:/, "");
}

// 새 회원의 아이디. 제공자 ID에는 아이디로 쓸 수 없는 문자가 섞일 수 있어 해시로 바꾼다.
export const accountIdFor = (providerKey: string, providerUserId: string) => (
  `${providerKey}_${createHash("sha256").update(providerUserId).digest("hex").slice(0, 20)}`
);

// 소셜로 가입한 회원은 비밀번호로 로그인하지 않는다. 필수 컬럼을 채우되 누구도 알 수 없는 값을 넣는다.
// 앞의 고정 문자는 비밀번호 정책(영문·숫자·특수문자 포함)을 어떤 설정에서도 통과시키기 위한 것이다.
export const unusablePassword = () => `Sl1!${randomBytes(32).toString("base64url")}`;
