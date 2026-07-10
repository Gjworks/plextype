import MyStoreSupport from "@/extensions/store/MyStoreSupport";

const UserStoreSupportPage = async ({ searchParams }: { searchParams: Promise<{ page?: string }> }) => {
  const { page = "1" } = await searchParams;
  return <MyStoreSupport page={Number(page) || 1} />;
};

export default UserStoreSupportPage;
