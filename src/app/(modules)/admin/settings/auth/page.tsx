import Settings from "@/modules/user/admin/settings";
import { getAuthSettingsAdminAction } from "@/modules/user/actions/settings.action";
import { getUserLayoutAdminAction } from "@/modules/user/actions/user-layout.action";
import { userLayoutOptions } from "@extensions";

const Page = async () => {
  const [authResult, siteResult] = await Promise.all([
    getAuthSettingsAdminAction(),
    getUserLayoutAdminAction(),
  ]);

  return (
    <Settings
      initialAuthSettings={authResult.data || undefined}
      initialSiteSettings={siteResult.data || undefined}
      userLayoutOptions={userLayoutOptions}
    />
  );
};

export default Page;
