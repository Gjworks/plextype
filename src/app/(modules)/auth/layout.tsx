export const dynamic = 'force-dynamic';
import { AuthLayout } from "@project/extensions";
import { getPublicSiteSettingsAction } from '@/modules/admin/actions/settings.action';

const PageLayout = async ({ children }) => {
  const settings = await getPublicSiteSettingsAction();

  return <AuthLayout siteUrl={settings.data?.siteUrl}>{children}</AuthLayout>
}

export default PageLayout
