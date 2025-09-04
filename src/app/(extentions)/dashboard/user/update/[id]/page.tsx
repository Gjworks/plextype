import DashboardUserUpdate from "@/extentions/user/admin/templates/update";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <DashboardUserUpdate id={id} />;
};

export default Page;
