import Admin from "@/modules/admin";
import { getAuthSettingsAdminAction } from "@/modules/admin/actions/settings.action";

const Page = async () => {
  const result = await getAuthSettingsAdminAction();

  return <Admin.Settings section="auth" initialAuthSettings={result.data || undefined} />;
};

export default Page;
