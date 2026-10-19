import { NextResponse } from "next/server";
import { getNotificationSettingsRuntimeAction } from "@/modules/notification/actions/settings.action";
import { getPublicSiteSettingsAction } from "@/modules/admin/actions/settings.action";

export async function GET() {
  const [notificationSettings, siteSettings] = await Promise.all([
    getNotificationSettingsRuntimeAction(),
    getPublicSiteSettingsAction(),
  ]);

  return NextResponse.json({
    success: true,
    pwaEnabled: notificationSettings.pwaEnabled,
    webPushEnabled: notificationSettings.webPushEnabled,
    appName: siteSettings.data?.appName || "plextype",
    projectTitle: siteSettings.data?.projectTitle || siteSettings.data?.appName || "plextype",
  });
}
