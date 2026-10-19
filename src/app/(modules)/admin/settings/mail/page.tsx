import { getMailSettingsAdminAction } from "@/modules/admin/actions/mail-settings.action";
import MailSettingsPage from "@/modules/admin/tpl/mailSettings";
import { getAdminMenuRegistry } from "@/core/registry/adminRegistry";

export default async function Page() {
  const result = await getMailSettingsAdminAction();
  if (!result.success || !result.data)
    return (
      <p role="alert" className="p-6">
        {result.message}
      </p>
    );
  const menus = getAdminMenuRegistry();
  const tabs =
    (Array.isArray(menus) ? menus : []).find((menu) => menu.id === "settings")
      ?.items ?? [];
  return <MailSettingsPage initial={result.data} tabs={tabs} />;
}
