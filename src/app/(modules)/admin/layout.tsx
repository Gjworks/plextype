import { AdminLayout as FallbackAdminLayoutClient, adminLayouts } from '@project/extensions'
import { getAuthSettingsAdminAction, getPublicSiteSettingsAction } from '@/modules/admin/actions/settings.action'

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const [settings, authSettings] = await Promise.all([
    getPublicSiteSettingsAction(),
    getAuthSettingsAdminAction(),
  ])
  const appName = settings.data?.appName || 'Gjworks'
  const adminLayoutKey = settings.data?.adminLayout || 'project'
  const AdminLayoutClient = adminLayouts[adminLayoutKey] || FallbackAdminLayoutClient

  return (
    <AdminLayoutClient
      appName={appName}
      adminSessionGuard={authSettings.data?.adminSessionGuard ?? true}
    >
      {children}
    </AdminLayoutClient>
  )
}

export default AdminLayout
