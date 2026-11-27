// 회원 모듈의 소셜 로그인. 카카오·네이버·구글·애플·깃허브·페이스북과 등록된 제공자의 계정으로 로그인, 가입, 기존 계정 연결을 제공한다.
// 구성과 설정 방법, 제공자를 추가하는 방법은 같은 폴더의 README.md를 본다.
//
// 이 파일이 내보내는 것이 회원 화면을 그리는 회원 스킨에서 써도 되는 전부다.
// 화면 쪽 묶음에 들어가도 되는 것만 내보낸다. 제공자 정의를 만들 때 쓰는 것은 `@/modules/user/social/providers`에 따로 있다.
// 여기서 내보낸 이름과 형식은 더하기만 하고, 있는 것의 이름과 뜻은 바꾸지 않는다.
export { ProviderIcon } from "@/modules/user/tpl/shared/SocialProviderIcon";
// 회원 화면을 만들 때 쓰는 것: 연결 목록 조회, 연결 해제(form action), 주소.
export { getMySocialLinksAction, unlinkSocialAccountAction } from "@/modules/user/actions/social.action";
export { SOCIAL_LOGIN_LINKS_PATH, socialLoginLinkStartPath } from "./paths";
export type { SocialLoginLink, SocialLoginMessageViewProps, SocialLoginUserLinksViewProps } from "@/modules/user/actions/social.type";
// 스킨이 안내 화면을 직접 그릴 때 쓰는 것: 코드별 문구.
export { SOCIAL_LOGIN_MESSAGES, socialLoginMessage, type SocialLoginMessageCode } from "./messages";
