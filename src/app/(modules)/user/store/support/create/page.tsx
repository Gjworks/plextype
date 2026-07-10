import MyStoreSupportCreate from "@/extensions/store/MyStoreSupportCreate";

const UserStoreSupportCreatePage = async ({ searchParams }: { searchParams: Promise<{ order?: string }> }) => {
  const { order = "" } = await searchParams;
  return <MyStoreSupportCreate orderUuid={order} />;
};

export default UserStoreSupportCreatePage;
