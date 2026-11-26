import type React from "react";

import Register from "@/modules/user/tpl/default/register";
import { LoginProviderButtonList } from "@/modules/user/tpl/shared/LoginProviderButtons";
import { getLoginProviders } from "@/core/utils/auth/loginProviders";
import { getAuthSettingsRuntimeAction } from "@/modules/user/actions/auth-settings";
import { getPublicSiteSettingsAction } from "@/modules/admin/actions/settings.action";
import { userLayouts } from "@extensions";
import { redirect } from "next/navigation";

const Page = async () => {
  const [authSettings, settings, loginProviderList] = await Promise.all([
    getAuthSettingsRuntimeAction(),
    getPublicSiteSettingsAction(),
    getLoginProviders(),
  ]);

  if (!authSettings.registrationEnabled) {
    redirect("/auth/signin?reason=registration-disabled");
  }

  const userLayoutKey = settings.data?.userLayout || "default";
  const skin = userLayouts[userLayoutKey];
  const SelectedRegister: React.ComponentType<any> = skin?.register || Register;
  const loginProviders = <LoginProviderButtonList providers={loginProviderList} />;

  // 로그인 페이지와 같은 규칙: 코어의 기본 화면과 직접 놓겠다고 밝힌 스킨에는 넘기고, 그 밖에는 코어가 화면 아래에 놓는다.
  if (!skin?.register || skin.placesLoginProviders) return <SelectedRegister loginProviders={loginProviders} loginProviderList={loginProviderList} />;
  return (
    <>
      <SelectedRegister />
      {loginProviders}
    </>
  );
};

export default Page;
