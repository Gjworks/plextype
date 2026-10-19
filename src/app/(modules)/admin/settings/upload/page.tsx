import Settings from "@/modules/attachment/admin/settings";
import { getUploadSettingsAdminAction } from "@/modules/attachment/actions/settings.action";

const Page = async () => {
  const result = await getUploadSettingsAdminAction();

  return <Settings initialUploadSettings={result.data || undefined} />;
};

export default Page;
