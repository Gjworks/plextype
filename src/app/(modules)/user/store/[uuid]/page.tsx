import MyStorePurchaseDetail from "@/extensions/store/MyStorePurchaseDetail";

export const dynamic = "force-dynamic";

const UserStorePurchaseDetailPage = async ({ params }: { params: Promise<{ uuid: string }> }) => {
  const { uuid } = await params;
  return <MyStorePurchaseDetail uuid={uuid} />;
};

export default UserStorePurchaseDetailPage;
