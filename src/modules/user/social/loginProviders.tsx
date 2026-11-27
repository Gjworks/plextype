import { defineLoginProviders } from "@/core/registry/defineLoginProviders";

import { ProviderIcon } from "@/modules/user/tpl/shared/SocialProviderIcon";
import { getActiveProviders } from "./config";

// 관리자 화면에서 켜고 키를 넣은 제공자만 로그인·가입 화면에 버튼으로 나온다.
export default defineLoginProviders(async () => (await getActiveProviders()).map((provider) => ({
  key: `social-login-${provider.key}`,
  label: `${provider.label}로 계속하기`,
  href: `/api/social-login/${provider.key}/start`,
  icon: <ProviderIcon providerKey={provider.key} label={provider.label} logo={provider.logo} />,
  brand: provider.brand,
})));
