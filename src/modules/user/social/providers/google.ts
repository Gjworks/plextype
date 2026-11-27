import { CLIENT_ID_FIELD, CLIENT_SECRET_FIELD, getJson, oauth2Provider, text } from "./oauth2.ts";

export default oauth2Provider({
  key: "google",
  label: "구글",
  brand: { background: "#FFFFFF", color: "#1F1F1F" },
  fields: [CLIENT_ID_FIELD("클라이언트 ID"), CLIENT_SECRET_FIELD("클라이언트 보안 비밀번호")],
  guide: {
    consoleName: "Google Cloud 콘솔",
    consoleUrl: "https://console.cloud.google.com/apis/credentials",
    steps: [
      "프로젝트를 만들고 OAuth 동의 화면을 설정합니다.",
      "사용자 인증 정보에서 OAuth 클라이언트 ID를 만들고 유형을 웹 애플리케이션으로 고릅니다.",
      "승인된 리디렉션 URI에 아래 주소를 등록합니다.",
      "발급된 클라이언트 ID와 클라이언트 보안 비밀번호를 복사합니다.",
    ],
  },
  authorizeEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  scope: "openid email profile",
  loadProfile: async (accessToken, fetcher) => {
    const body = await getJson("https://openidconnect.googleapis.com/v1/userinfo", accessToken, fetcher);
    if (!text(body?.sub)) return null;
    return { id: body.sub, email: body.email_verified ? text(body.email) : null, name: text(body.name) };
  },
});
