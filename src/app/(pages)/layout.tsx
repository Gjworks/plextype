import "../globals.css";

import { DefaultLayout } from "@project/extensions";
import { getPublicSiteSettingsAction } from "@/modules/admin/actions/settings.action";

const PageLayout = async ({ children }) => {
  const settings = await getPublicSiteSettingsAction();

  return (
    <DefaultLayout
      siteTitle={settings.data?.projectTitle}
    >
      {children}
    </DefaultLayout>
  )
}

export default PageLayout
