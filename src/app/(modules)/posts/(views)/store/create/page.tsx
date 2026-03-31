import PostWrite from "@modules/posts/_tpl/default/write";


type Params = Promise<{ pid: string }>;

const Page = async ({params}: { params: Promise<{ pid: string }> }) => {
  const {pid} = await params;


  return (
    <>

    </>
  );
};

export default Page;
