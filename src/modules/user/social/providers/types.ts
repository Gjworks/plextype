// 제공자 정의의 형식. providers/ 아래 파일은 이 폴더 밖의 코드를 가져오지 않는다(../tests/providers.test.mjs가 그대로 불러 확인한다).
// 같은 이유로 이 폴더 안의 파일끼리는 확장자(.ts)까지 적어 가져온다. Node가 테스트에서 직접 읽으려면 확장자가 필요하다.
// 이 형식의 정의 하나가 제공자 하나다. 설정 화면과 버튼, 라우트는 등록된 정의(../registry.ts)를 따라 생긴다.

// 제공자가 돌려준 회원 정보 가운데 소셜 로그인이 쓰는 것.
export type SocialProfile = {
  // 제공자 안에서 회원을 가리키는 변하지 않는 값.
  id: string;
  // 제공자가 본인 것으로 확인한 이메일만 담는다. 확인되지 않았거나 제공에 동의하지 않았으면 null.
  email: string | null;
  name: string | null;
};

// 관리자 화면에서 입력받는 값 하나.
export type ProviderField = {
  // 저장할 때의 이름. clientId, clientSecret 외의 이름도 쓸 수 있다(예: 애플의 teamId).
  name: string;
  label: string;
  // true면 암호화해 저장하고 화면에 다시 보여 주지 않는다.
  secret?: boolean;
  // false면 비워 둬도 켤 수 있다. 생략하면 필수.
  required?: boolean;
  // 여러 줄 값(예: 키 파일의 내용).
  multiline?: boolean;
  placeholder?: string;
};

// 입력 칸의 name → 값. 비어 있는 칸은 들어 있지 않다.
export type ProviderConfig = Record<string, string>;

export type ProviderGuide = {
  consoleName: string;
  consoleUrl: string;
  // 콘솔의 메뉴 이름은 제공자가 바꿀 수 있다. 순서와 넣을 값을 알려 주는 정도로 적는다.
  steps: string[];
};

// 한 가지 색으로 그리는 로고. 놓이는 자리의 글자색(대표색 위의 색)으로 칠한다.
export type ProviderLogo = {
  viewBox: string;
  // SVG path의 d 값.
  d: string;
};

export type AuthorizeInput = { redirectUri: string; state: string };
export type ExchangeInput = { code: string; redirectUri: string; state: string };

export type ProviderDefinition = {
  // 주소와 저장 키, 연결 테이블의 provider 값에 쓴다. 소문자와 숫자, 하이픈으로 32자까지 쓴다(PROVIDER_KEY_PATTERN).
  // 한 번 쓰기 시작한 key는 바꾸지 않는다. 바꾸면 저장된 설정과 회원의 연결을 찾지 못한다.
  key: string;
  label: string;
  // 버튼과 설정 화면에 쓰는 대표색.
  brand: { background: string; color: string };
  // 생략하면 이름의 첫 글자가 대신 나온다.
  logo?: ProviderLogo;
  fields: ProviderField[];
  guide: ProviderGuide;
  // 제공자가 인가 결과를 POST로 돌려주는지(애플). 생략하면 GET 쿼리로 돌아온다.
  callbackMethod?: "POST";
  authorizeUrl: (config: ProviderConfig, input: AuthorizeInput) => string;
  // 인가 코드를 회원 정보로 바꾼다. 어느 단계든 실패하면 던진다.
  fetchProfile: (config: ProviderConfig, input: ExchangeInput, fetcher: typeof fetch) => Promise<SocialProfile>;
};
