import Admin from "@/modules/admin";
import { getSearchSettingsAdminAction } from "@/modules/admin/actions/settings.action";

const Page = async () => {
  const result = await getSearchSettingsAdminAction();

  return <Admin.Settings section="search" initialSearchSettings={result.data || undefined} />;
};

export default Page;
