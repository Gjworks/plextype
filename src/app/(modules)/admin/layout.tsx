import AdminLayoutClient from './AdminLayoutClient'

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const appName = process.env.APP_NAME || 'Gjworks'

  return <AdminLayoutClient appName={appName}>{children}</AdminLayoutClient>
}

export default AdminLayout
