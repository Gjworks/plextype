import AdminSupportDetailPage from "@/extensions/service/adminSupportDetail";

const Page = async ({ params }: { params: Promise<{ uuid: string }> }) => {
  const { uuid } = await params;
  return <AdminSupportDetailPage uuid={uuid} />;
};

export default Page;
