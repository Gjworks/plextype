import Bottom from "@plextype/components/panel/Bottom";
import PostWrite from "@/extentions/posts/templates/default/write";
import { upsertPost } from "@/extentions/posts/scripts/actions/upsertPost";

type Params = Promise<{ pid: string }>;

const Page = async ({ params }: { params: Promise<{ pid: string }> }) => {
  const { pid } = await params;

  const savePost = async (formData: FormData) => {
    "use server";
    await upsertPost('store', formData);
  };
  return (
    <>
      <Bottom>
        <div className="border-b border-gray-100">
          <div className="max-w-screen-lg mx-auto px-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 flex items-center">
                <div className="text-sm border border-gray-200 py-1 px-4 rounded-md shadow-sm shadow-gray-100">
                  카테고리
                </div>
              </div>
              <div className="col-span-1">
                <div className="flex justify-center items-center py-4">
                  <div className="text-center">
                    <div className="font-medium text-lg">Works 글쓰기 </div>
                  </div>
                </div>
              </div>
              <div className="col-span-1 flex items-center justify-end gap-8">
                <div className="text-sm border border-gray-200 py-1 px-4 rounded-md shadow-sm shadow-gray-100">
                  게시판 선택
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-screen-md mx-auto px-3">
          <div className="py-10 rounded-2xl">
            <div className="max-w-screen-lg mx-auto px-3">
              <div className="py-5 px-8 rounded-2xl">
                <div className="pt-8 mb-6">
                  <PostWrite savePost={savePost}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Bottom>
    </>
  );
};

export default Page;
