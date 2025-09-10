"use client"

import {usePostContext} from "./PostProvider";
import PostsCategories from "@/extentions/posts/templates/default/category";

const PostsHeader = () => {
  const { postInfo } = usePostContext();

  return (
    <>
      <div className="pt-20">
        <div className="text-3xl text-center font-semibold dark:text-white py-10">
          {postInfo.postName}
        </div>
        <div className="mb-6">
          <PostsCategories />
        </div>
      </div>
    </>
  );
};

export default PostsHeader;
