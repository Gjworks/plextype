"use client";

import DashboardPostCategories from "@extentions/posts/_admin/categories";
import PostCategory from "@extentions/posts/_admin/components/postCategory";
import { useParams } from "next/navigation";

const Page = () => {
  const params = useParams();
  const id = params?.id as string;
  return (
    <>
      <div className="py-6">
        <PostCategory postId={id} />
      </div>
      <DashboardPostCategories />
    </>
  );
};

export default Page;
