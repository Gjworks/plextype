"use client";

import DashboardPostCategories from "@modules/posts/_admin/categories";
import PostCategory from "@modules/posts/_admin/components/postCategory";
import { useParams } from "next/navigation";

const Page = () => {
  const params = useParams();
  const id = params?.id as string;

  return (
    <>
      <div className="py-6">
        <PostCategory postId={id} />
      </div>
      <DashboardPostCategories moduleId={id} />
    </>
  );
};

export default Page;
