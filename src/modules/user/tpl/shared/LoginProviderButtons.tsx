import type { LoginProvider } from "@/core/registry/defineLoginProviders";
import { getLoginProviders } from "@/core/utils/auth/loginProviders";

// 수단이 이 개수를 넘으면 한 줄에 하나씩 쌓지 않고 아이콘만 나란히 놓는다. 로그인 폼보다 버튼 목록이 길어지지 않게 하기 위함이다.
const FULL_BUTTON_LIMIT = 3;

// 흰 바탕의 버튼은 화면 바탕과 구분되지 않아 테두리를 준다.
const needsBorder = (background?: string) => !background || /^#f{3}(f{3})?$/i.test(background);

// 로그인 수단 목록(getLoginProviders의 결과)을 코어의 기본 모양 버튼으로 그린다. 목록이 비어 있으면 아무것도 그리지 않는다.
export const LoginProviderButtonList = ({ providers }: { providers: LoginProvider[] }) => {
  if (providers.length === 0) return null;

  const compact = providers.length > FULL_BUTTON_LIMIT;
  const borderClass = (background?: string) => (needsBorder(background) ? "border border-gray-200 dark:border-white/15" : "border border-transparent");
  const baseColors = "bg-white text-gray-700 dark:bg-white/5 dark:text-white/80";

  return (
    <div className="mt-6 grid gap-4">
      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-white/40">
        <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
        {compact ? "다른 계정으로 계속하기" : "또는"}
        <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
      </div>
      {/* 로그인 수단의 주소는 API 라우트라 화면 전환(Link)이 아닌 일반 이동으로 연다. */}
      {compact ? (
        <div className="flex flex-wrap justify-center gap-2.5">
          {providers.map((provider) => (
            <a
              key={provider.key}
              href={provider.href}
              aria-label={provider.label}
              title={provider.label}
              style={provider.brand ? { background: provider.brand.background, color: provider.brand.color } : undefined}
              className={`flex size-11 items-center justify-center rounded-full text-sm font-semibold transition-transform hover:-translate-y-0.5 ${borderClass(provider.brand?.background)} ${provider.brand ? "" : baseColors}`}
            >
              {provider.icon ?? provider.label.slice(0, 1)}
            </a>
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {providers.map((provider) => (
            <a
              key={provider.key}
              href={provider.href}
              style={provider.brand ? { background: provider.brand.background, color: provider.brand.color } : undefined}
              className={`flex h-12 items-center justify-center gap-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 ${borderClass(provider.brand?.background)} ${provider.brand ? "" : baseColors}`}
            >
              {provider.icon}
              {provider.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

// 등록된 로그인 수단(defineLoginProviders)을 읽어 버튼으로 그린다.
// redirect는 로그인 뒤 돌아갈 사이트 안의 경로다.
const LoginProviderButtons = async ({ redirect }: { redirect?: string }) => (
  <LoginProviderButtonList providers={await getLoginProviders(redirect)} />
);

export default LoginProviderButtons;
