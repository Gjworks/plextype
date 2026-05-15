import "../globals.css";

import DefaultLayout from '@extensions/layouts/default/Layout'
import { getPublicSiteSettingsAction } from "@/modules/admin/actions/settings.action";

const PageLayout = async ({ children }) => {
  const settings = await getPublicSiteSettingsAction();

  return (
    <DefaultLayout
      siteUrl={settings.data?.siteUrl}
      siteTitle={settings.data?.projectTitle}
    >
      {children}
    </DefaultLayout>
  )
}

export default PageLayout
