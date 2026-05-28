import AdminLayoutClient from './AdminLayoutClient'
import { getAuthSettingsAdminAction, getPublicSiteSettingsAction } from '@/modules/admin/actions/settings.action'

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const [settings, authSettings] = await Promise.all([
    getPublicSiteSettingsAction(),
    getAuthSettingsAdminAction(),
  ])
  const appName = settings.data?.appName || 'Gjworks'

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
