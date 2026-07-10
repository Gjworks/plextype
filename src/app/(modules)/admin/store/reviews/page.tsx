import StoreAdminReviews from "@/extensions/store/adminReviews";

const StoreAdminReviewsPage = async ({ searchParams }: { searchParams: Promise<{ page?: string }> }) => {
  const { page = "1" } = await searchParams;
  return <StoreAdminReviews page={Number(page) || 1} />;
};

export default StoreAdminReviewsPage;
