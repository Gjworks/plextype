import { StoreAdminSettlementDashboard } from "@/extensions/store/admin";

const StoreAdminSettlementsPage = async ({ searchParams }: { searchParams: Promise<{ page?: string }> }) => {
  const { page = "1" } = await searchParams;
  return <StoreAdminSettlementDashboard page={Number(page) || 1} />;
};

export default StoreAdminSettlementsPage;
