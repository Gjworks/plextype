"use client";

import { useEffect, useState } from "react";
import { getCategories } from "@/extentions/posts/scripts/postsModel";

const PostsCategories = () => {
  const [Category, setCategory] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => {
    getCategoryList();
    //
  }, []);

  const getCategoryList = async () => {
    const categories = await getCategories();
    // console.log(categories)
    setCategory(categories);
  };
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
            {category.name}
          </div>
        ))}
      </div>
    </>
  );
};

export default PostsCategories;
