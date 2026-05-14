import Admin from "@/modules/admin";
import { getSiteSettingsAdminAction } from "@/modules/admin/actions/settings.action";

const Page = async () => {
  const result = await getSiteSettingsAdminAction();

  return <Admin.Settings section="site" initialSiteSettings={result.data || undefined} />;
};

export default Page;
