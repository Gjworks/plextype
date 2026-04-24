export const dynamic = 'force-dynamic';
import AuthLayout from '@extensions/layouts/authLayout/Layout'

const PageLayout = ({ children }) => {
  return <AuthLayout>{children}</AuthLayout>
}

export default PageLayout
