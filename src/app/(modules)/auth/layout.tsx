export const dynamic = 'force-dynamic';
import { AuthLayout, userLayouts } from "@extensions";
import { getPublicSiteSettingsAction } from '@/modules/admin/actions/settings.action';

const PageLayout = async ({ children }) => {
  const settings = await getPublicSiteSettingsAction();
  const userLayoutKey = settings.data?.userLayout || "default";
  const SelectedAuthLayout = userLayouts[userLayoutKey]?.authLayout || userLayouts.default.authLayout || AuthLayout;

  return (
    <SelectedAuthLayout
      siteUrl={settings.data?.siteUrl || "/"}
      siteTitle={settings.data?.projectTitle || settings.data?.appName || "Plextype"}
    >
      {children}
    </SelectedAuthLayout>
  )
}

export default PageLayout
