import PostWrite from "@/extentions/posts/templates/default/write";
import { upsertPost } from "@/extentions/posts/scripts/actions/upsertPost";

type Post = {
  id: number;
  title: string | null;
  content: string | null;
  createdAt: Date;
  user: {
    id: number;
    nickName: string;
  } | null;
};

const Page = async ({ params }: { params: Promise<{ pid: string }> }) => {
  const { pid } = await params;


  const savePost = async (formData: FormData) => {
    "use server";
    await upsertPost(pid, formData);
  };

  return (
    <div className="max-w-screen-lg mx-auto px-3">
      <div className="py-5 rounded-2xl">
        <div className="pt-8 mb-6">
          <PostWrite savePost={savePost} />
        </div>
      </div>
    </div>
  );
};

export default Page;