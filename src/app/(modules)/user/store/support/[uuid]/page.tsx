import MyStoreSupportDetail from "@/extensions/store/MyStoreSupportDetail";

const UserStoreSupportDetailPage = async ({ params }: { params: Promise<{ uuid: string }> }) => {
  const { uuid } = await params;
  return <MyStoreSupportDetail uuid={uuid} />;
};

export default UserStoreSupportDetailPage;
