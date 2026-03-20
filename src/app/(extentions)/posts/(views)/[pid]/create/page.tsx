import PostWrite from "@extentions/posts/_tpl/default/write";
import { saveDocument } from "@extentions/posts/_actions/document.action";

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
    return await saveDocument(pid, formData, "/posts/" + pid);

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