import type { ProviderGuide, ProviderLogo } from "@/modules/user/social/providers";

// 설정 화면의 입력 칸 하나. 비밀 값은 내용을 담지 않고 저장 여부만 알린다.
export type SocialLoginFieldView = {
  name: string;
  label: string;
  secret: boolean;
  required: boolean;
  multiline: boolean;
  placeholder: string;
  // 비밀이 아닌 칸의 저장된 값. 비밀 칸은 항상 빈 문자열.
  value: string;
  // 비밀 칸에 저장된 값이 있는지.
  configured: boolean;
};

export type SocialLoginProviderSettings = {
  key: string;
  label: string;
  brand: { background: string; color: string };
  // 제공자 정의의 로고. 없으면 null이며 ProviderIcon이 기본 로고나 이름의 첫 글자로 그린다.
  logo: ProviderLogo | null;
  enabled: boolean;
  // 켜져 있고 필수 값이 갖춰져 로그인 화면에 버튼이 나오는지.
  active: boolean;
  linkedCount: number;
  // 제공자 콘솔에 등록할 리다이렉트 주소.
  callbackUrl: string;
  fields: SocialLoginFieldView[];
  guide: ProviderGuide;
};

export type SocialLoginSettingsView = {
  providers: SocialLoginProviderSettings[];
  // 서버에 비밀 값을 암호화할 키(SECRET_KEY)가 있는지. 없으면 비밀 값을 저장할 수 없다.
  encryptionReady: boolean;
};

// 회원 스킨의 소셜 로그인 화면이 받는 속성. 다른 프로젝트의 스킨이 이 형식에 기대므로 항목을 더하기만 하고, 있는 항목의 이름과 뜻은 바꾸지 않는다.

// 스킨의 socialLoginMessage: 소셜 로그인이 중간에 끝났을 때의 안내 화면(/auth/social-login).
export type SocialLoginMessageViewProps = {
  // 안내할 문구.
  message: string;
  // 문구의 종류(social/messages.ts의 key). 알 수 없는 값이면 null.
  code: string | null;
  signinHref: string;
};

export type SocialLoginLink = {
  key: string;
  label: string;
  brand: { background: string; color: string };
  // 제공자 정의의 로고. ProviderIcon의 logo에 그대로 넘긴다.
  logo: ProviderLogo | null;
  // 지금 이 사이트에서 켜져 있어 새로 연결할 수 있는지.
  available: boolean;
  linked: boolean;
  email: string | null;
  linkedAt: string | null;
  // 소셜 로그인으로 만든 계정의 연결은 해제할 수 없다. 해제하면 로그인할 방법이 없어진다.
  canUnlink: boolean;
};

// 스킨의 socialLoginLinks: 로그인한 회원이 소셜 계정을 연결하거나 해제하는 화면(/user/social-login).
export type SocialLoginUserLinksViewProps = {
  title: string;
  description: string;
  // 기본 화면이 회원 스킨의 마이페이지 틀 안에 그려지는지. true면 제목은 틀이 보이므로 그리지 않는다. 스킨이 등록한 화면에는 항상 false다.
  framed: boolean;
  // linkHref: 이 제공자를 연결하러 가는 주소. API 라우트이므로 Link가 아닌 <a>로 연다.
  links: Array<SocialLoginLink & { linkHref: string }>;
  // <form action>에 넣는 서버 액션. 폼은 name="provider"인 값(제공자 key)을 보낸다.
  unlinkAction: (formData: FormData) => Promise<void>;
};
