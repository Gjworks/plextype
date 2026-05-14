import AdminLayoutClient from './AdminLayoutClient'
import { getPublicSiteSettingsAction } from '@/modules/admin/actions/settings.action'

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const settings = await getPublicSiteSettingsAction()
  const appName = settings.data?.appName || 'Gjworks'

  return <AdminLayoutClient appName={appName}>{children}</AdminLayoutClient>
}

export default AdminLayout
