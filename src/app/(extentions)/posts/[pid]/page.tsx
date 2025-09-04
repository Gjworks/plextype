import { Suspense } from "react";
import PostsList from "@/extentions/posts/templates/default/listAction";

// type Params = Promise<{ pid: string }>;
// type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

type Params = { pid: string };
type SearchParams = { [key: string]: string | string[] | undefined };

const Page = async (props: { params: Params; searchParams: SearchParams }) => {
  const params = props.params;
  const searchParams = props.searchParams;
  const query = searchParams.query;

  return (
    <>
      <div className={`max-w-screen-xl mx-auto px-3`}>
        <Suspense fallback={<div>Loading posts...</div>}>
          <PostsList params={{ pid: params.pid }} />
        </Suspense>
      </div>
    </>
  );
};

export default Page;
