# 소셜 로그인

회원 모듈(`src/modules/user`)이 제공하는 기능으로, 카카오·네이버·구글·애플·깃허브·페이스북 계정으로 로그인, 가입, 기존 계정 연결을 합니다.
라이브러리 없이 OAuth 2.0 인가 코드 흐름을 직접 구현합니다. 그 밖의 제공자는 코어를 고치지 않고 등록해 더합니다(아래 `제공자 추가`).

## 설정

관리자 화면의 `회원 설정 > 소셜 로그인`(`/admin/user/social-login`)에서 설정합니다. 서버 파일을 고치거나 다시 시작할 필요가 없습니다.

1. 쓸 제공자의 카드를 눌러 설정 창을 엽니다.
2. 창의 안내를 따라 제공자 콘솔에서 키를 발급받고, 창에 나온 리다이렉트 주소를 복사해 콘솔에 등록합니다.
3. 발급받은 값을 넣고 `사용하기`를 켠 뒤 저장합니다. 로그인·가입 화면에 버튼이 바로 나옵니다.

- 켜지 않은 제공자는 버튼도 라우트도 열리지 않습니다. 하나도 켜지 않은 사이트에서는 로그인 화면이 달라지지 않습니다.
- 가입에는 이메일이 필요합니다. 제공자 콘솔에서 이메일 제공 동의 항목을 켭니다.
- 애플은 https 주소만 받으므로 로컬 주소에서는 쓸 수 없습니다.
- 설정은 설정 테이블(`AppSetting`)에 `social-login.<제공자>` 키로 저장합니다. 비밀 값은 서버의 `SECRET_KEY`로 암호화해 `social-login.<제공자>.secret`에 따로 두며 화면에 다시 보여 주지 않습니다.
- `SECRET_KEY`가 바뀌면 저장된 비밀 값을 풀 수 없으므로 다시 입력해야 합니다.
- 켜진 제공자가 셋을 넘으면 로그인 화면의 버튼이 아이콘만 나란히 놓인 모양으로 바뀝니다.

## 제공자 추가

제공자 하나는 정의(`ProviderDefinition`) 하나입니다. 설정 화면의 카드와 입력 칸, 로그인 버튼, 콜백 라우트, 가입과 계정 연결은 등록된 정의를 따라 생기므로 다른 곳은 고치지 않습니다.

등록하는 곳은 셋이고, 이 순서로 합쳐집니다. 같은 `key`는 뒤쪽이 앞의 것을 대신합니다.

| 누가 | 어디에 | 내보내는 모양 |
| --- | --- | --- |
| 코어 | `social/providers/index.ts`의 `BUILT_IN_PROVIDERS` | 기본 제공자. 받아 쓰는 프로젝트는 고치지 않습니다. |
| 쉬운 설치 패키지 | 패키지 루트의 `socialProviders.ts` | `export default defineSocialProviders([...])` |
| 프로젝트 | `src/extensions/socialProviders.ts` | `export const socialProviders: ProviderDefinition[] = [...]` |

정의를 만드는 데 쓰는 것은 모두 `@/modules/user/social/providers`에서 가져옵니다.

```ts
// src/extensions/social/discord.ts
import { CLIENT_ID_FIELD, CLIENT_SECRET_FIELD, getJson, oauth2Provider, text } from "@/modules/user/social/providers";

export default oauth2Provider({
  key: "discord",
  label: "디스코드",
  brand: { background: "#5865F2", color: "#FFFFFF" },
  fields: [CLIENT_ID_FIELD("Client ID"), CLIENT_SECRET_FIELD("Client Secret")],
  guide: {
    consoleName: "Discord Developer Portal",
    consoleUrl: "https://discord.com/developers/applications",
    steps: ["애플리케이션을 만들고 OAuth2의 Redirects에 아래 주소를 등록합니다.", "Client ID와 Client Secret을 복사합니다."],
  },
  authorizeEndpoint: "https://discord.com/oauth2/authorize",
  tokenEndpoint: "https://discord.com/api/oauth2/token",
  scope: "identify email",
  loadProfile: async (accessToken, fetcher) => {
    const user = await getJson("https://discord.com/api/users/@me", accessToken, fetcher);
    if (!text(user?.id)) return null;
    return { id: user.id, email: user.verified ? text(user.email) : null, name: text(user.global_name) ?? text(user.username) };
  },
});
```

```ts
// src/extensions/socialProviders.ts
import type { ProviderDefinition } from "@/modules/user/social/providers";

import discord from "./social/discord";

export const socialProviders: ProviderDefinition[] = [discord];
```

- 표준 OAuth 2.0 제공자는 `oauth2Provider`에 주소와 `loadProfile`만 넘깁니다. 흐름이 다르면 `ProviderDefinition`을 직접 채웁니다(`social/providers/apple.ts` 참고).
- `key`는 주소(`/api/social-login/<key>/...`)와 설정 키, 연결 테이블에 그대로 들어갑니다. 소문자·숫자·하이픈으로 32자까지 쓰고, 쓰기 시작한 뒤에는 바꾸지 않습니다. 형식을 벗어난 정의는 등록되지 않고 서버 로그에 남습니다.
- `loadProfile`은 제공자가 본인 것으로 확인한 이메일만 `email`에 담습니다. 확인 여부를 알 수 없으면 그 이유를 주석으로 남깁니다. 확인되지 않은 이메일을 담으면 남의 이메일로 가입할 수 있게 됩니다.
- 입력받을 값은 `fields`에 적습니다. `secret: true`인 값은 암호화해 저장됩니다.
- 결과를 POST로 돌려주는 제공자는 `callbackMethod: "POST"`를 적습니다. 리다이렉트 주소가 `/api/external-callback/social-login/<key>`로 바뀝니다.
- 로고는 `logo`(`viewBox`와 path의 `d`)로 넣습니다. 한 가지 색으로 그려지며, 생략하면 이름의 첫 글자가 나옵니다.
- 정의는 서버에서만 불립니다. 화면 컴포넌트를 가져오지 않습니다.

코어에 기본 제공자를 더할 때는 `social/providers/<제공자>.ts`를 만들어 `BUILT_IN_PROVIDERS`에 넣고, 로고를 `tpl/shared/SocialProviderIcon.tsx`의 `paths`에 넣고, `social/tests/providers.test.mjs`에 회원 정보 해석을 확인하는 경우를 더합니다.

## 동작

- **로그인**: 연결된 회원이 있으면 그 회원으로 로그인합니다. 승인 대기·차단 상태는 비밀번호 로그인과 같이 막습니다.
- **가입**: 연결된 회원이 없으면 새 회원을 만듭니다. 회원가입 허용과 가입 후 상태 설정을 그대로 따릅니다.
  아이디는 `<제공자>_<해시>`로 만들고, 닉네임은 제공자가 준 이름을 쓰되 겹치면 숫자를 붙입니다.
- **같은 이메일의 기존 회원**: 자동으로 합치지 않습니다. 이메일만으로 다른 사람의 계정에 들어가는 일을 막기 위함입니다.
  기존 회원은 로그인한 뒤 연결·해제 화면(`/user/social-login`)에서 직접 연결합니다.
- **연결 해제**: 소셜 로그인으로 만든 계정의 연결은 해제할 수 없습니다. 비밀번호를 모르는 계정이라 로그인할 방법이 없어집니다.
- **회원 삭제**: 회원을 지우는 `removeUser`(`actions/user.ts`)가 그 회원의 연결도 지웁니다.

## 구성

회원 모듈의 폴더 규칙을 따라 나뉘어 있습니다. 아래 경로는 `src/modules/user` 기준입니다.

| 경로 | 내용 |
| --- | --- |
| `social/providers/` | 제공자 정의(파일 하나에 제공자 하나), 공통 OAuth 2.0 흐름(`oauth2.ts`), 형식(`types.ts`), 목록 합치기(`index.ts`). 이 폴더 밖의 코드를 가져오지 않습니다. |
| `social/registry.ts` | 코어·패키지·프로젝트의 제공자를 합친 목록. 서버에서만 가져옵니다. |
| `social/config.ts` | 저장된 설정 읽기, 켜진 제공자 판정 |
| `social/flow.ts` | state 저장·확인, 사이트 주소·IP 구하기, 새 회원의 아이디·비밀번호 |
| `social/complete.ts` | 본인 확인 뒤의 로그인·가입·연결 판단 |
| `social/messages.ts` | 안내 화면의 코드별 문구 |
| `social/paths.ts` | 회원 화면이 쓰는 주소 |
| `social/loginProviders.tsx` | 켜진 제공자를 로그인·가입 화면의 버튼으로 내놓음(`src/core/utils/auth/loginProviders.ts`가 읽음) |
| `social/index.ts` | 화면을 만드는 쪽에서 써도 되는 것 |
| `social/tests/` | 제공자 정의와 목록 합치기 테스트 |
| `actions/social.action.ts`, `social.query.ts`, `social.type.ts` | 설정 조회·저장, 회원의 연결 조회·해제, 연결 테이블 쿼리, 형식 |
| `admin/socialLogin.tsx` | 관리자 설정 화면 |
| `tpl/default/socialLoginLinks.tsx`, `socialLoginMessage.tsx` | 연결·해제 화면과 안내 화면의 기본 모양 |
| `tpl/shared/SocialProviderIcon.tsx` | 제공자 로고 |
| `registry.tsx` | 관리자 메뉴(`회원 설정` 아래) |

라우트는 `src/app`에 있습니다.

| 주소 | 파일 |
| --- | --- |
| `/api/social-login/<key>/start` | `src/app/api/social-login/[provider]/start/route.ts` |
| `/api/social-login/<key>/callback` | `src/app/api/social-login/[provider]/callback/route.ts` |
| `/api/external-callback/social-login/<key>` | `src/app/api/external-callback/social-login/[provider]/route.ts` |
| `/auth/social-login` | `src/app/(modules)/auth/social-login/page.tsx` |
| `/user/social-login` | `src/app/(modules)/user/social-login/page.tsx` |
| `/admin/user/social-login` | `src/app/(modules)/admin/user/social-login/page.tsx` |

연결 테이블 `social_login_account`의 모델과 마이그레이션은 코어 스키마(`src/core/prisma`)에 있습니다.

## 회원 화면

회원이 보는 화면은 적용된 회원 스킨(`defineUserSkin`)이 그립니다. 데이터와 동작은 페이지가 준비해 속성으로 넘기므로 스킨은 그리기만 합니다.

| 화면 | 주소 | 스킨의 등록 | 받는 속성 |
| --- | --- | --- | --- |
| 로그인·가입 버튼 | 로그인·가입 화면 | `placesLoginProviders: true`. `signin`·`register`가 받는 `loginProviderList`로 그립니다. | `LoginProvider[]` |
| 연결·해제 | `/user/social-login` | `socialLoginLinks` | `SocialLoginUserLinksViewProps` |
| 안내 | `/auth/social-login` | `socialLoginMessage` | `SocialLoginMessageViewProps` |

- 셋 다 생략할 수 있습니다. 생략하면 기본 모양(`tpl/default/socialLoginLinks.tsx`, `socialLoginMessage.tsx`, 코어의 버튼)이 쓰입니다.
- 스킨이 `socialLoginLinks`를 등록하면 메뉴와 제목까지 그 컴포넌트가 직접 그립니다. 등록하지 않으면 기본 화면이 그 스킨의 마이페이지 틀(`pageFrame`) 안에 그려지고, 틀도 없으면 카드 안에 제목을 직접 그립니다.
- 안내 화면은 스킨의 `authLayout` 안에 그려집니다.
- 회원 메뉴의 링크는 회원 스킨이 넣습니다. 기본 스킨은 켜진 제공자나 연결한 계정이 있을 때만 메뉴를 보입니다.
- 연결·해제 화면의 주소는 `/user/social-login`으로 정해져 있습니다. 연결을 마친 회원을 이 주소로 돌려보냅니다.
- 스킨은 관리자의 사이트 설정에서 고른 것이 적용되므로, 스킨을 바꾸면 이 화면들도 함께 바뀝니다.

```tsx
import { defineUserSkin } from "@/core/registry/define";

import SocialLoginLinks from "./SocialLoginLinks";
import SocialLoginMessage from "./SocialLoginMessage";

export const mySkin = defineUserSkin({
  key: "my-skin",
  // ...timeline, update, preferences, delete
  placesLoginProviders: true,
  socialLoginLinks: SocialLoginLinks,
  socialLoginMessage: SocialLoginMessage,
});
```

스킨의 화면은 `@/modules/user/social`(`index.ts`)이 내보내는 것만 씁니다. 안쪽 파일은 버전마다 바뀔 수 있습니다.

| 이름 | 내용 |
| --- | --- |
| `ProviderIcon` | 제공자 로고. `providerKey`, `label`과 함께 연결 목록의 `logo`를 넘깁니다. |
| `getMySocialLinksAction()` | 로그인한 회원의 제공자별 연결 상태(`SocialLoginLink[]`). 로그인하지 않았으면 `null`. |
| `unlinkSocialAccountAction` | 연결 해제. `<form action>`에 넣고 `name="provider"`로 제공자 key를 보냅니다. |
| `socialLoginLinkStartPath(key)` | 그 제공자를 연결하러 가는 주소. API 라우트이므로 `<a>`로 엽니다. |
| `SOCIAL_LOGIN_LINKS_PATH` | 연결·해제 화면의 주소 |
| `socialLoginMessage(code)`, `SOCIAL_LOGIN_MESSAGES` | 안내 화면의 코드별 문구 |

## 확인

```bash
node --test src/modules/user/social/tests/providers.test.mjs
```

## 지원하지 않는 것

- 모바일 앱(Flutter)의 로그인. 앱은 쿠키 기반 API 로그인을 쓰므로 웹의 리다이렉트 흐름을 그대로 쓸 수 없습니다.
- 이메일을 제공하지 않는 계정의 가입.
