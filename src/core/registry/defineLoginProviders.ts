import type React from "react";

// 비밀번호 외의 로그인 수단(SSO 등)을 로그인·가입 화면에 등록하는 형식.
// OAuth 2.0 제공자를 더하는 것이라면 이 형식 대신 소셜 로그인의 제공자로 등록한다(src/modules/user/social/README.md). 설정 화면과 계정 연결을 그대로 쓴다.
// 쉬운 설치 패키지는 루트의 loginProviders.ts(x)에서, 프로젝트 확장은 src/extensions/loginProviders.ts에서 등록한다.
// 등록한 쪽이 하는 일은 버튼을 내놓는 것까지다. 본인 확인은 href의 라우트에서 직접 하고,
// 끝나면 issueLoginSession(@/core/utils/auth/loginSession)으로 세션을 발급한다.

export type LoginProvider = {
  // 다른 수단과 겹치지 않는 값. 같은 key가 여러 번 등록되면 나중 것이 남는다(코어, 패키지, 프로젝트 확장 순).
  key: string;
  // 버튼에 적을 문구(예: "카카오로 계속하기").
  label: string;
  // 버튼을 누르면 이동할 같은 사이트 안의 주소. 로그인 뒤 돌아갈 경로가 있으면 코어가 redirect 쿼리로 붙인다.
  href: string;
  icon?: React.ReactNode;
  // 버튼의 바탕색과 글자색. 생략하면 화면의 기본 버튼 색을 쓴다.
  brand?: { background: string; color: string };
};

// 화면을 그릴 때마다 서버에서 불린다. 지금 쓸 수 있는 수단만 돌려준다(예: 키가 설정된 제공자).
export type LoginProviderSource = () => LoginProvider[] | Promise<LoginProvider[]>;

export const defineLoginProviders = (source: LoginProviderSource) => source;
