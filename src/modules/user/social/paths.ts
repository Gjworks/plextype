// 화면을 만드는 쪽(회원 스킨, 프로젝트 확장)이 주소를 직접 적지 않도록 한곳에 둔다.

// 회원의 연결·해제 화면 주소. 연결을 마친 회원을 이 주소로 돌려보내고(complete.ts), 해제 뒤 이 주소의 화면을 새로 그린다(actions/social.action.ts).
export const SOCIAL_LOGIN_LINKS_PATH = "/user/social-login";

// 로그인한 회원이 제공자를 자기 계정에 연결하러 가는 주소. API 라우트이므로 Link가 아닌 <a>로 연다.
export const socialLoginLinkStartPath = (providerKey: string) => `/api/social-login/${providerKey}/start?mode=link`;
