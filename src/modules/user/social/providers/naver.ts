import { CLIENT_ID_FIELD, CLIENT_SECRET_FIELD, getJson, oauth2Provider, text } from "./oauth2.ts";

export default oauth2Provider({
  key: "naver",
  label: "네이버",
  brand: { background: "#03C75A", color: "#FFFFFF" },
  fields: [CLIENT_ID_FIELD("Client ID"), CLIENT_SECRET_FIELD("Client Secret")],
  guide: {
    consoleName: "네이버 개발자 센터",
    consoleUrl: "https://developers.naver.com/apps/",
    steps: [
      "애플리케이션을 등록하고 사용 API로 네이버 로그인을 고릅니다.",
      "제공 정보에서 이메일 주소와 별명을 선택합니다. 이메일이 없으면 가입할 수 없습니다.",
      "환경을 PC 웹으로 추가하고 서비스 URL에 사이트 주소를, Callback URL에 아래 주소를 넣습니다.",
      "발급된 Client ID와 Client Secret을 복사합니다.",
    ],
  },
  authorizeEndpoint: "https://nid.naver.com/oauth2.0/authorize",
  tokenEndpoint: "https://nid.naver.com/oauth2.0/token",
  loadProfile: async (accessToken, fetcher) => {
    const body = await getJson("https://openapi.naver.com/v1/nid/me", accessToken, fetcher);
    const profile = body?.response;
    if (body?.resultcode !== "00" || !text(profile?.id)) return null;
    // 네이버는 이메일 확인 여부를 따로 알려 주지 않는다. 회원이 제공에 동의한 연락처 이메일을 그대로 쓴다.
    return { id: profile.id, email: text(profile.email), name: text(profile.nickname) ?? text(profile.name) };
  },
});
