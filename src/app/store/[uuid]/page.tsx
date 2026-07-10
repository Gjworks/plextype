import { DefaultLayout } from "@extensions";
import StoreProductPublicDetail from "@/extensions/store/StoreProductPublicDetail";
import { getPublicSiteSettingsAction } from "@/modules/admin/actions/settings.action";

const StoreProductPublicDetailPage = async ({ params }: { params: Promise<{ uuid: string }> }) => {
  const [{ uuid }, settings] = await Promise.all([
    params,
    getPublicSiteSettingsAction(),
  ]);

  return (
    <DefaultLayout siteTitle={settings.data?.projectTitle}>
      <StoreProductPublicDetail uuid={uuid} />
    </DefaultLayout>
  );
};

export default StoreProductPublicDetailPage;
