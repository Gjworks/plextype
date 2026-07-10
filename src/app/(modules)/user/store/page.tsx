import MyStorePurchases from "@/extensions/store/MyStorePurchases";

const UserStorePage = async ({ searchParams }: { searchParams: Promise<{ page?: string }> }) => {
  const { page = "1" } = await searchParams;
  return <MyStorePurchases page={Number(page) || 1} />;
};

export default UserStorePage;
