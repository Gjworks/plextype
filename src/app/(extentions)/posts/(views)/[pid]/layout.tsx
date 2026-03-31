// src/app/(extentions)/posts/(views)/[pid]/layout.tsx

import React from "react";
import { getPostsInfo } from "@extentions/posts/_actions/posts.action";
import PostNotFound from "@extentions/posts/_tpl/default/notFound";

export default async function PageLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="posts-container w-full min-h-screen">
      {children}
    </div>
  );
}