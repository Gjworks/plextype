import Settings from "@/modules/notification/admin/settings";
import { getNotificationSettingsAdminAction } from "@/modules/notification/actions/settings.action";

const Page = async () => {
  const result = await getNotificationSettingsAdminAction();

  return <Settings initialNotificationSettings={result.data || undefined} />;
};

export default Page;
