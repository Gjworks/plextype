"use client"

import {usePostContext} from "./PostProvider";
import PostsCategories from "@/modules/posts/tpl/default/category";

const PostsHeader = () => {
  const { postInfo } = usePostContext();
  const description = postInfo.moduleDesc?.trim();

  return (
    <header className="pt-8 sm:pt-10">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pb-4">
        <h1 className="break-words text-xl font-bold tracking-[-0.01em] text-gray-950 dark:text-dark-50 sm:text-2xl">
          {postInfo.moduleName}
        </h1>
        {description && description !== postInfo.moduleName && (
          <p className="break-words text-[13px] text-gray-500 dark:text-dark-400">{description}</p>
        )}
      </div>
      <PostsCategories />
    </header>
  );
};

export default PostsHeader;
