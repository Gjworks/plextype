
import {getDocument} from "@/extentions/posts/scripts/actions/getPosts";
import PostsRead from "@/extentions/posts/templates/default/read";

const Page = async ({ params }: {params: Promise<{ pid: string; id: string }>;}) => {
  const { pid, id } = await params;

  // ✅ 게시글 정보 가져오기
  const document = await getDocument(id);

  return (
    <PostsRead
      document={document}
    />
  );
};

export default Page;
