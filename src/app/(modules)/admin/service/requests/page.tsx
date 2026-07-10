import { ServiceAdminRequests } from "@/extensions/service/admin";

const AdminServiceRequestsPage = async ({ searchParams }: { searchParams: Promise<{ page?: string }> }) => {
  const { page = "1" } = await searchParams;
  return <ServiceAdminRequests page={Number(page) || 1} />;
};

export default AdminServiceRequestsPage;
