import DefaultLayout from "@/layouts/default/Layout";
import HomePage from "@/core/registry/defaultHomePage";

const PreviewsPage = () => {
  return (
    <DefaultLayout siteTitle="Plextype" siteUrl="/previews" useConfiguredNavigation={false}>
      <HomePage />
    </DefaultLayout>
  );
};

export default PreviewsPage;
