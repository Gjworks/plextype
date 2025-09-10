"use client";

import { useEffect, useState } from "react";
import { getCategories } from "@/extentions/posts/scripts/postsModel";
import {usePostContext} from "@/extentions/posts/templates/default/PostProvider";

const PostsCategories = () => {
  // const [Category, setCategory] = useState<{ id: number; name: string }[]>([]);
  const { postInfo } = usePostContext();
  const Category = postInfo.categories;
  // useEffect(() => {
  //   getCategoryList();
  //   //
  // }, []);
  //
  // const getCategoryList = async () => {
  //   const categories = await getCategories();
  //   console.log(categories)
  //   // console.log(categories)
  //   setCategory(categories);
  // };
  // const categories = await getCategories()

  return (
    <>
      <div className="flex gap-4 items-center flex-wrap justify-center">
        <div className="flex rounded-full px-6 py-1 text-sm bg-gray-100 dark:bg-dark-900 dark:text-white cursor-pointer hover:bg-gray-700 hover:text-gray-100">
          전체
        </div>
        {Category.map((category) => (
          <div
            key={category.id}
            className="flex rounded-full px-6 py-1 text-sm bg-gray-100 cursor-pointer hover:bg-gray-700 hover:text-gray-100 dark:bg-dark-900 dark:text-white"
          >
            {category.title}
          </div>
        ))}
      </div>
    </>
  );
};

export default PostsCategories;
