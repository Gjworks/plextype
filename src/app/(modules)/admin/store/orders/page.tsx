import { StoreAdminOrders } from "@/extensions/store/admin";

const StoreAdminOrdersPage = async ({ searchParams }: { searchParams: Promise<{ page?: string }> }) => {
  const { page = "1" } = await searchParams;
  return <StoreAdminOrders page={Number(page) || 1} />;
};

export default StoreAdminOrdersPage;
