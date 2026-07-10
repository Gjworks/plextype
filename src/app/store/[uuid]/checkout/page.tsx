import { DefaultLayout } from "@extensions";
import StoreProductCheckout from "@/extensions/store/StoreProductCheckout";
import { getPublicSiteSettingsAction } from "@/modules/admin/actions/settings.action";

export const dynamic = "force-dynamic";

const Page = async ({ params }: { params: Promise<{ uuid: string }> }) => {
  const [{ uuid }, settings] = await Promise.all([
    params,
    getPublicSiteSettingsAction(),
  ]);

  return (
    <DefaultLayout siteTitle={settings.data?.projectTitle}>
      <StoreProductCheckout uuid={uuid} />
    </DefaultLayout>
  );
};

export default Page;
