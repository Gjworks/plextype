import { CLIENT_ID_FIELD, CLIENT_SECRET_FIELD, getJson, oauth2Provider, text } from "./oauth2.ts";

export default oauth2Provider({
  key: "facebook",
  label: "페이스북",
  brand: { background: "#1877F2", color: "#FFFFFF" },
  fields: [CLIENT_ID_FIELD("앱 ID"), CLIENT_SECRET_FIELD("앱 시크릿 코드")],
  guide: {
    consoleName: "Meta for Developers",
    consoleUrl: "https://developers.facebook.com/apps/",
    steps: [
      "앱을 만들고 Facebook 로그인 제품을 추가합니다.",
      "Facebook 로그인 설정의 유효한 OAuth 리디렉션 URI에 아래 주소를 등록합니다.",
      "앱 설정의 기본 설정에서 앱 ID와 앱 시크릿 코드를 복사합니다.",
      "email 권한을 사용할 수 있게 하고 앱을 라이브 모드로 전환합니다.",
    ],
  },
  authorizeEndpoint: "https://www.facebook.com/dialog/oauth",
  tokenEndpoint: "https://graph.facebook.com/oauth/access_token",
  scope: "email public_profile",
  loadProfile: async (accessToken, fetcher) => {
    const body = await getJson("https://graph.facebook.com/me?fields=id,name,email", accessToken, fetcher);
    if (!text(body?.id)) return null;
    // 페이스북은 확인된 이메일만 돌려준다.
    return { id: body.id, email: text(body.email), name: text(body.name) };
  },
});
