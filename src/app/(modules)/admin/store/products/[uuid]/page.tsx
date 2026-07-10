import StoreAdminProductDetail from "@/extensions/store/adminProductDetail";

const Page = async ({ params }: { params: Promise<{ uuid: string }> }) => {
  const { uuid } = await params;
  return <StoreAdminProductDetail uuid={uuid} />;
};

export default Page;
