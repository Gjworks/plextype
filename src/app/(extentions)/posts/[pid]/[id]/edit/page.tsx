import PostWrite from "@/extentions/posts/templates/default/write";
import { getPost } from "@/extentions/posts/scripts/actions/getPost";
import { upsertPost } from "@/extentions/posts/scripts/actions/upsertPost";

type Post = {
  id: number;
  categoryId:number | null;
  title: string | null;
  content: string | null;
  createdAt: Date;
  user: {
    id: number;
    nickName: string;
  } | null;
};

const Page = async ({ params }: { params: Promise<{ pid: string; id?: string }> }) => {
  const { pid, id } = await params;

  let existingPost: Post | null = null;
  if (id) {
    existingPost = await getPost(Number(id));
    if (!existingPost) {
      return <div>존재하지 않는 글입니다.</div>;
    }
  }

  const savePost = async (formData: FormData) => {
    "use server";
    await upsertPost(pid, formData);
  };

  return (
    <div className="max-w-screen-lg mx-auto px-3">
      <div className="py-5 px-8 rounded-2xl">
        <div className="pt-8 mb-6">
          <PostWrite savePost={savePost} existingPost={existingPost} />
        </div>
      </div>
    </div>
  );
};

export default Page;