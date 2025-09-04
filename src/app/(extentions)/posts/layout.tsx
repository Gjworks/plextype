import DefaultLayout from 'src/layouts/fullLayout/Layout'

const PageLayout = ({ children, bottom }) => {
  return (
    <DefaultLayout>
      {children} {bottom}
    </DefaultLayout>
  )
}

export default PageLayout
