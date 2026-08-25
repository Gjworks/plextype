import { getPublicSiteSettingsAction } from "@/modules/admin/actions/settings.action";
import Signin from "@/modules/user/tpl/default/signin";
import { userLayouts } from "@extensions";

const Page = async () => {
  const settings = await getPublicSiteSettingsAction();
  const userLayoutKey = settings.data?.userLayout || "default";
  const SelectedSignin = userLayouts[userLayoutKey]?.signin || Signin;

  return <SelectedSignin />;
};

export default Page;
