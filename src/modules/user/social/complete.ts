import { getAuthSettingsRuntimeAction } from "@/modules/user/actions/auth-settings";
import { saveUser } from "@/modules/user/actions/user";
import { getLoggedUserAction } from "@/modules/user/actions/user.action";
import type { LoginSessionUser } from "@/core/utils/auth/loginSession";

import * as query from "@/modules/user/actions/social.query";
import type { ProviderDefinition, SocialProfile } from "./providers";
import { accountIdFor, unusablePassword, type SocialLoginState } from "./flow";
import type { SocialLoginMessageCode } from "./messages";
import { SOCIAL_LOGIN_LINKS_PATH } from "./paths";

// 제공자에서 본인 확인을 마친 뒤 할 일을 정한다. 응답을 만드는 것은 콜백 라우트의 몫이다.
export type SocialLoginOutcome =
  // 세션을 발급하고 redirect로 보낸다.
  | { type: "session"; user: LoginSessionUser; redirect: string }
  // 세션은 그대로 두고 path로 보낸다(계정 연결 완료).
  | { type: "redirect"; path: string }
  | { type: "error"; code: SocialLoginMessageCode };

const error = (code: SocialLoginMessageCode): SocialLoginOutcome => ({ type: "error", code });

// 닉네임은 2자 이상이고 회원끼리 겹칠 수 없다. 제공자가 준 이름을 먼저 써 보고, 겹치면 숫자를 붙인다.
const NICKNAME_MAX = 20;
const NICKNAME_ATTEMPTS = 5;
const nicknameCandidates = (provider: ProviderDefinition, name: string | null) => {
  const base = (name && name.length >= 2 ? name : `${provider.label}회원`).slice(0, NICKNAME_MAX);
  return Array.from({ length: NICKNAME_ATTEMPTS }, (_, index) => (
    index === 0 ? base : `${base.slice(0, NICKNAME_MAX - 5)}${Math.floor(1000 + Math.random() * 9000)}`
  ));
};

const statusError = (user: { isAdmin: boolean | null; status: string | null }) => {
  const status = user.status || "active";
  if (user.isAdmin || status === "active") return null;
  return error(status === "pending" ? "pending" : "blocked");
};

async function linkToCurrentUser(definition: ProviderDefinition, profile: SocialProfile, state: SocialLoginState): Promise<SocialLoginOutcome> {
  const current = await getLoggedUserAction();
  // 연결을 시작한 회원과 돌아온 회원이 다르면(그 사이 로그아웃하거나 다른 계정으로 로그인) 연결하지 않는다.
  if (!current.id || current.id !== state.userId) return error("login-required");
  const provider = definition.key;

  const existing = await query.findLinkByProviderUser(provider, profile.id);
  if (existing && existing.userId !== current.id) return error("already-linked");
  if (!existing) {
    if (await query.findLinkByUserProvider(current.id, provider)) return error("provider-already-linked");
    await query.createLink({ userId: current.id, provider, providerUserId: profile.id, email: profile.email, createdAccount: false });
  }
  return { type: "redirect", path: `${SOCIAL_LOGIN_LINKS_PATH}?linked=${provider}` };
}

async function signUp(definition: ProviderDefinition, profile: SocialProfile, redirect: string): Promise<SocialLoginOutcome> {
  const provider = definition.key;
  if (!(await getAuthSettingsRuntimeAction()).registrationEnabled) return error("registration-disabled");
  if (!profile.email) return error("email-required");
  // 이메일이 같다는 이유만으로 기존 계정에 로그인시키지 않는다. 기존 회원은 로그인한 뒤 직접 연결한다.
  if (await query.findUserIdByEmail(profile.email)) return error("email-in-use");

  let created: any = null;
  for (const nickName of nicknameCandidates(definition, profile.name)) {
    // 회원 모듈의 가입 로직을 그대로 쓴다. 가입 후 상태 설정과 user.saved 트리거가 일반 가입과 같게 적용된다.
    const result = await saveUser({
      accountId: accountIdFor(provider, profile.id),
      password: unusablePassword(),
      email_address: profile.email,
      nickName,
    }, false);
    if (result.success) { created = result.data; break; }
    if (result.fieldErrors?.email_address) return error("email-in-use");
    if (!result.fieldErrors?.nickName) break;
  }
  if (!created?.id) return error("signup-failed");

  await query.createLink({ userId: created.id, provider, providerUserId: profile.id, email: profile.email, createdAccount: true });
  return statusError(created) ?? { type: "session", user: created, redirect };
}

export async function completeSocialLogin(provider: ProviderDefinition, profile: SocialProfile, state: SocialLoginState): Promise<SocialLoginOutcome> {
  if (state.mode === "link") return linkToCurrentUser(provider, profile, state);

  const link = await query.findLinkByProviderUser(provider.key, profile.id);
  if (link) {
    const user = await query.findLoginUserById(link.userId);
    if (user) return statusError(user) ?? { type: "session", user, redirect: state.redirect };
    // 회원이 이미 삭제되었는데 연결만 남은 경우. 지우고 새로 가입하는 흐름으로 넘긴다.
    await query.deleteLinkById(link.id);
  }
  return signUp(provider, profile, state.redirect);
}
