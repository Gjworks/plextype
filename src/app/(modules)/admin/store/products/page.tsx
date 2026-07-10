import StoreAdminProducts from "@/extensions/store/adminProducts";

const StoreAdminProductsPage = async ({ searchParams }: { searchParams: Promise<{ page?: string }> }) => {
  const { page = "1" } = await searchParams;
  return <StoreAdminProducts page={Number(page) || 1} />;
};

export default StoreAdminProductsPage;
