import { getPublicSiteSettingsAction } from "@/modules/admin/actions/settings.action";
import Signin from "@/modules/user/tpl/default/signin";
import LoginProviderButtons from "@/modules/user/tpl/shared/LoginProviderButtons";
import { userLayouts } from "@extensions";

const Page = async ({ searchParams }: { searchParams: Promise<{ redirect?: string | string[] }> }) => {
  const { redirect } = await searchParams;
  const settings = await getPublicSiteSettingsAction();
  const userLayoutKey = settings.data?.userLayout || "default";
  const skin = userLayouts[userLayoutKey];
  const SelectedSignin = skin?.signin || Signin;
  const loginProviders = <LoginProviderButtons redirect={typeof redirect === "string" ? redirect : undefined} />;

  // 코어의 기본 화면과, 직접 놓겠다고 밝힌 스킨에는 버튼을 넘겨 원하는 자리에 놓게 한다.
  // 그 밖의 스킨은 버튼을 받는 줄 모를 수 있으므로 코어가 화면 아래에 놓는다. 스킨을 바꿔도 로그인 수단이 사라지지 않는다.
  if (!skin?.signin || skin.placesLoginProviders) return <SelectedSignin loginProviders={loginProviders} />;
  return (
    <>
      <SelectedSignin />
      {loginProviders}
    </>
  );
};

export default Page;
