// src/app/(extentions)/posts/(views)/[pid]/layout.tsx

import React from "react";
import { getPostsInfo } from "@modules/posts/_actions/posts.action";
import PostNotFound from "@modules/posts/_tpl/default/notFound";

export default async function PageLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="posts-container w-full">
      {children}
    </div>
  );
}