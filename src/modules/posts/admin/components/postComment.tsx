import React from "react";

const PostComment = () => {
  return (
    <>
      <div className="px-3">
        <div className="grid grid-cols-4 gap-8 py-10">
          <div className="col-span-1">
            <div className="text-lg font-semibold text-gray-600  mb-3">
              댓글설정
            </div>
            <div className="text-gray-400 text-sm">
              댓글 관련 설정을 합니다.
            </div>
          </div>
          <div className="col-span-3">
            <div className="grid grid-col-span-2">
              <div className="col-span-2 grid grid-cols-3 gap-6 hover:bg-gray-50 p-5">
                <div className="col-span-3 sm:col-span-2">
                  <label>
                    <div className="text-sm text-black mb-3">댓글 사용</div>
                  </label>
                  <label htmlFor="commentState" className="m-0">
                    <input
                      type="checkbox"
                      name="commentState"
                      id="commentState"
                      className="peer hidden"
                    />

                    <div className="relative block h-6 w-11 cursor-pointer rounded-full bg-gray-200 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-md after:transition-transform after:content-[''] peer-checked:bg-cyan-500 peer-checked:after:translate-x-5 dark:after:bg-white"></div>
                  </label>

                  <div className="text-sm text-dark-400 pt-2 font-light">
                    댓글을 사용할지 여부를 결정합니다.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PostComment;
