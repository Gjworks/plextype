import PostWrite from "@/extentions/posts/templates/default/writeAction";

type Params = Promise<{ pid: string, id?:string }>;

const Page = async (props: { params: Params }) => {
    const params = await props.params;
    console.log(params)
    return (
        <>
            <div className="max-w-screen-lg mx-auto px-3">
                <div className="py-5 px-8 rounded-2xl">
                    <div className="pt-8 mb-6">
                        <PostWrite params={{ pid: params.pid, id:params.id }} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default Page;
