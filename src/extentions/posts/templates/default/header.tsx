import PostsCategories from "@/extentions/posts/templates/default/category";

const PostsHeader = () => {
  return (
    <>
      <div className="pt-20">
        <div className="text-3xl text-center font-semibold dark:text-white py-10">
          기술지원
        </div>
        <div className="mb-6">
          <PostsCategories />
        </div>
      </div>
    </>
  );
};

export default PostsHeader;
