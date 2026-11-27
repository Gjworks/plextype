// 소셜 로그인이 중간에 끝났을 때 /auth/social-login 화면에 보여 줄 문구.
// 주소에는 코드만 싣는다. 문구를 주소로 받으면 누구나 로그인 화면에 임의의 글을 띄운 링크를 만들 수 있다.
export const SOCIAL_LOGIN_MESSAGES = {
  "unknown-provider": "지원하지 않는 로그인 수단입니다.",
  "not-configured": "이 로그인 수단은 아직 사용할 수 없습니다.",
  "invalid-state": "로그인 요청이 만료되었거나 올바르지 않습니다. 다시 시도해주세요.",
  cancelled: "로그인이 취소되었습니다.",
  "provider-error": "로그인 제공자와 통신하지 못했습니다. 잠시 후 다시 시도해주세요.",
  "registration-disabled": "현재 회원가입을 받지 않습니다. 기존 회원은 로그인한 뒤 계정 설정에서 연결할 수 있습니다.",
  "email-required": "이메일 제공에 동의해야 가입할 수 있습니다. 동의 항목을 확인한 뒤 다시 시도해주세요.",
  "email-in-use": "같은 이메일로 가입된 계정이 있습니다. 그 계정으로 로그인한 뒤 계정 설정에서 연결해주세요.",
  "signup-failed": "가입을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.",
  pending: "가입이 접수되었습니다. 관리자 승인 후 로그인할 수 있습니다.",
  blocked: "현재 사용할 수 없는 계정입니다.",
  "login-required": "계정을 연결하려면 먼저 로그인해주세요.",
  "already-linked": "이 계정은 이미 다른 회원에게 연결되어 있습니다.",
  "provider-already-linked": "같은 로그인 수단의 계정이 이미 연결되어 있습니다. 먼저 연결을 해제해주세요.",
} as const;

export type SocialLoginMessageCode = keyof typeof SOCIAL_LOGIN_MESSAGES;

export const socialLoginMessage = (code: string | undefined) => (
  code && code in SOCIAL_LOGIN_MESSAGES
    ? SOCIAL_LOGIN_MESSAGES[code as SocialLoginMessageCode]
    : "로그인을 완료하지 못했습니다. 다시 시도해주세요."
);
