import { CLIENT_ID_FIELD, CLIENT_SECRET_FIELD, getJson, oauth2Provider, text } from "./oauth2.ts";

// 깃허브 API는 User-Agent가 없는 요청을 거절한다.
const HEADERS = { Accept: "application/vnd.github+json", "User-Agent": "plextype-social-login" };

export default oauth2Provider({
  key: "github",
  label: "깃허브",
  brand: { background: "#181717", color: "#FFFFFF" },
  fields: [CLIENT_ID_FIELD("Client ID"), CLIENT_SECRET_FIELD("Client secret")],
  guide: {
    consoleName: "GitHub Developer settings",
    consoleUrl: "https://github.com/settings/developers",
    steps: [
      "OAuth Apps에서 New OAuth App을 누릅니다.",
      "Homepage URL에 사이트 주소를, Authorization callback URL에 아래 주소를 넣습니다.",
      "등록한 뒤 Client ID를 복사하고, Generate a new client secret으로 시크릿을 만들어 복사합니다.",
    ],
  },
  authorizeEndpoint: "https://github.com/login/oauth/authorize",
  tokenEndpoint: "https://github.com/login/oauth/access_token",
  scope: "read:user user:email",
  loadProfile: async (accessToken, fetcher) => {
    const user = await getJson("https://api.github.com/user", accessToken, fetcher, HEADERS);
    if (user?.id === undefined || user?.id === null) return null;
    // 프로필의 이메일은 공개로 설정한 것만 나오고 확인 여부도 알 수 없다. 이메일 목록에서 확인된 대표 이메일을 찾는다.
    const emails = await getJson("https://api.github.com/user/emails", accessToken, fetcher, HEADERS);
    const primary = Array.isArray(emails) ? emails.find((item) => item?.primary && item?.verified) : null;
    return { id: String(user.id), email: text(primary?.email), name: text(user.name) ?? text(user.login) };
  },
});
