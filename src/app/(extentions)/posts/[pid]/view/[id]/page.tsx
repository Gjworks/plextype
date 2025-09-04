import PostsRead from "@/extentions/posts/templates/default/readAction";

type Params = { pid: string; id: string };

const Page = async (props: { params: Params }) => {
  const params = props.params;
  console.log(params.id);
  return (
    <>
      <PostsRead params={{ pid: params.pid, id: params.id }} />
    </>
  );
};
export default Page;
