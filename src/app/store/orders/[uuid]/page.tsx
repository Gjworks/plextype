import { DefaultLayout } from "@extensions";
import StoreOrderDetail from "@/extensions/store/StoreOrderDetail";
import { getPublicSiteSettingsAction } from "@/modules/admin/actions/settings.action";

export const dynamic = "force-dynamic";

const Page = async ({ params }: { params: Promise<{ uuid: string }> }) => {
  const [{ uuid }, settings] = await Promise.all([
    params,
    getPublicSiteSettingsAction(),
  ]);

  return (
    <DefaultLayout siteTitle={settings.data?.projectTitle}>
      <StoreOrderDetail uuid={uuid} />
    </DefaultLayout>
  );
};

export default Page;
