export const dynamic = 'force-dynamic';
import React from "react";
import DefaultLayout from "@extensions/layouts/default/Layout";
import { getPublicSiteSettingsAction } from "@/modules/admin/actions/settings.action";

export default async function PageLayout({
                                           children,

                                         }: {
  children: React.ReactNode
}) {
  const settings = await getPublicSiteSettingsAction();


  return (
    <DefaultLayout
      siteUrl={settings.data?.siteUrl}
      siteTitle={settings.data?.projectTitle}
    >
      {children}
    </DefaultLayout>
  );
}
