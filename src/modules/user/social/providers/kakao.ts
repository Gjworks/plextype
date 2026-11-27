import { CLIENT_ID_FIELD, CLIENT_SECRET_FIELD, getJson, oauth2Provider, text } from "./oauth2.ts";

export default oauth2Provider({
  key: "kakao",
  label: "카카오",
  brand: { background: "#FEE500", color: "#191919" },
  // 카카오의 클라이언트 시크릿은 콘솔에서 켠 경우에만 필요하다.
  fields: [CLIENT_ID_FIELD("REST API 키"), CLIENT_SECRET_FIELD("Client Secret", false)],
  guide: {
    consoleName: "카카오 디벨로퍼스",
    consoleUrl: "https://developers.kakao.com/console/app",
    steps: [
      "애플리케이션을 추가하고 앱 키에서 REST API 키를 복사합니다.",
      "카카오 로그인을 켜고 Redirect URI에 아래 주소를 등록합니다.",
      "동의항목에서 닉네임과 카카오계정(이메일)을 켭니다. 이메일이 없으면 가입할 수 없습니다.",
      "보안에서 Client Secret을 켰다면 그 값도 넣습니다. 켜지 않았다면 비워 둡니다.",
    ],
  },
  authorizeEndpoint: "https://kauth.kakao.com/oauth/authorize",
  tokenEndpoint: "https://kauth.kakao.com/oauth/token",
  // 카카오는 콘솔에서 켜지 않은 동의 항목을 scope로 요청하면 오류를 내므로 보내지 않는다.
  loadProfile: async (accessToken, fetcher) => {
    const body = await getJson("https://kapi.kakao.com/v2/user/me", accessToken, fetcher);
    if (body?.id === undefined || body?.id === null) return null;
    const account = body.kakao_account ?? {};
    return {
      id: String(body.id),
      email: account.is_email_valid && account.is_email_verified ? text(account.email) : null,
      name: text(account.profile?.nickname),
    };
  },
});
