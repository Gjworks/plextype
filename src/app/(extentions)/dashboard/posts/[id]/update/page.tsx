"use client";

import DashboardPostCreate from "@/extentions/posts/admin/templates/create";
import PostCategory from "@/extentions/posts/admin/templates/components/postCategory";

import { useParams } from "next/navigation";

const Page = () => {
  const params = useParams();
  const id = params?.id as string;

  return (
    <>
      <div className="py-6">
        <PostCategory postId={id} />
      </div>
      <DashboardPostCreate />
    </>
  );
};

export default Page;
