import AdminPartnerApplicationDetail from "@/extensions/service/adminPartnerApplicationDetail";

const AdminServiceRequestDetailPage = async ({ params }: { params: Promise<{ uuid: string }> }) => {
  const { uuid } = await params;
  return <AdminPartnerApplicationDetail uuid={uuid} />;
};

export default AdminServiceRequestDetailPage;
