import PostWrite from "@/extentions/posts/templates/default/write";
import {upsertPost} from "@/extentions/posts/scripts/actions/upsertPost";

type Params = Promise<{ pid: string }>;

const Page = async ({params}: { params: Promise<{ pid: string }> }) => {
  const {pid} = await params;

  const savePost = async (formData: FormData) => {
    "use server";
    await upsertPost('store', formData);
  };
  return (
    <>

    </>
  );
};

export default Page;
