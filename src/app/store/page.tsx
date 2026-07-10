import { DefaultLayout } from "@extensions";
import Storefront from "@/extensions/store/Storefront";
import { getPublicSiteSettingsAction } from "@/modules/admin/actions/settings.action";

const StorePage = async ({ searchParams }: { searchParams: Promise<{ page?: string }> }) => {
  const { page = "1" } = await searchParams;
  const settings = await getPublicSiteSettingsAction();

  return (
    <DefaultLayout siteTitle={settings.data?.projectTitle}>
      <Storefront page={Number(page) || 1} />
    </DefaultLayout>
  );
};

export default StorePage;
