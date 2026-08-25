import { getPublicSiteSettingsAction } from "@/modules/admin/actions/settings.action";
import ResetPasswordPage from "@/modules/user/tpl/default/resetPassword";
import { userLayouts } from "@extensions";

const Page = async ({ searchParams }: { searchParams: Promise<{ token?: string }> }) => {
  const [params, settings] = await Promise.all([
    searchParams,
    getPublicSiteSettingsAction(),
  ]);
  const userLayoutKey = settings.data?.userLayout || "default";
  const SelectedResetPassword = userLayouts[userLayoutKey]?.resetPassword || ResetPasswordPage;

  return <SelectedResetPassword token={params.token || ""} />;
};

export default Page;
