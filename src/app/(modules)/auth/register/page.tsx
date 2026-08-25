import Register from "@/modules/user/tpl/default/register";
import { getAuthSettingsRuntimeAction } from "@/modules/admin/actions/auth-settings";
import { getPublicSiteSettingsAction } from "@/modules/admin/actions/settings.action";
import { userLayouts } from "@extensions";
import { redirect } from "next/navigation";

const Page = async () => {
  const [authSettings, settings] = await Promise.all([
    getAuthSettingsRuntimeAction(),
    getPublicSiteSettingsAction(),
  ]);

  if (!authSettings.registrationEnabled) {
    redirect("/auth/signin?reason=registration-disabled");
  }

  const userLayoutKey = settings.data?.userLayout || "default";
  const SelectedRegister = userLayouts[userLayoutKey]?.register || Register;

  return <SelectedRegister />;
};

export default Page;
