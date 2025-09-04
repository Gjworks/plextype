"use client";

import React, { useState } from "react";
type PostInfoData = {
  pid: string;
  postName: string;
  postDesc?: string | null; // <-- 수정
  listCount: number;
  pageCount: number;
  documentLike: boolean;
  consultingState: boolean;
};

type PostInfoProps = {
  id?: string;
  value: PostInfoData;
  onChange: (val: PostInfoData) => void;
};

const PostInfo: React.FC<PostInfoProps> = ({ id, value, onChange }) => {
  return (
    <>
      {id && <input type="hidden" name="postId" value={id} />}
      <input type="hidden" name="moduleType" value="posts" />
      <div className="">
        <div className="grid grid-cols-4 gap-8 py-10">
          <div className="col-span-1">
            <div className="text-lg font-semibold text-gray-600  mb-3">
              게시판 기본설정
            </div>
            <div className="text-gray-400 text-sm">
              게시판의 기본설정을 입력합니다.
            </div>
          </div>
          <div className="col-span-3">
            <div className="grid grid-col-span-2">
              <div className="col-span-2 grid grid-cols-3 gap-6 hover:bg-gray-50 p-5">
                <div className="col-span-3 sm:col-span-2">
                  <label htmlFor="pId">
                    <div className="text-sm text-black mb-3">모듈ID</div>
                  </label>

                  <input
                    type="text"
                    name="moduleId"
                    id="moduleId"
                    className="border border-gray-200 hover:border-gray-950 focus:border-gray-950 w-full py-2 px-3 outline-none rounded-md text-sm shadow-sm shadow-gray-100"
                    placeholder="/?mid=post"
                    // defaultValue={posts?.mid}
                    value={value.pid}
                    onChange={(e) =>
                      onChange({ ...value, pid: e.target.value })
                    }
                  />

                  <div className="text-sm text-dark-400 pt-2 font-light">
                    게시판의 모듈ID는 중복될 수 없는 이름입니다.
                  </div>
                </div>
              </div>
              <div className="col-span-2 grid grid-cols-3 gap-6 hover:bg-gray-50 p-5">
                <div className="col-span-3 sm:col-span-2">
                  <label htmlFor="moduleName">
                    <div className="text-sm text-black mb-3">게시판이름</div>
                  </label>

                  <input
                    type="text"
                    name="moduleName"
                    id="moduleName"
                    className="border border-gray-200 hover:border-gray-950 focus:border-gray-950 w-full py-2 px-3 outline-none rounded-md text-sm shadow-sm shadow-gray-100"
                    // defaultValue={posts?.moduleName}
                    value={value.postName}
                    onChange={(e) =>
                      onChange({ ...value, postName: e.target.value })
                    }
                  />

                  <div className="text-sm text-dark-400 pt-2 font-light">
                    게시판이름을 정하세요. 브라우저 타이틀 혹은 게시판의 명칭을
                    나타냅니다.
                  </div>
                </div>
              </div>
              <div className="col-span-2 grid grid-cols-3 gap-6 hover:bg-gray-50 p-5">
                <div className="col-span-3 sm:col-span-2">
                  <label htmlFor="listCount">
                    <div className="text-sm text-black mb-3">목록 수</div>
                  </label>

                  <input
                    type="text"
                    name="listCount"
                    id="listCount"
                    className="border border-gray-200 hover:border-gray-950 focus:border-gray-950 w-16 py-2 px-3 outline-none rounded-md text-sm shadow-sm shadow-gray-100"
                    // defaultValue={
                    //   posts.config?.listCount ? posts.config?.listCount : "20"
                    // }
                    value={value.listCount}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        listCount: Number(e.target.value),
                      })
                    }
                  />

                  <div className="text-sm text-dark-400 pt-2 font-light">
                    한 페이지에 표시될 글 수를 지정할 수 있습니다. (기본 20개)
                  </div>
                </div>
              </div>
              <div className="col-span-2 grid grid-cols-3 gap-6 hover:bg-gray-50 p-5">
                <div className="col-span-3 sm:col-span-2">
                  <label htmlFor="listCount">
                    <div className="text-sm text-black mb-3">페이지 수</div>
                  </label>

                  <input
                    type="text"
                    name="pageCount"
                    id="pageCount"
                    className="border border-gray-200 hover:border-gray-950 focus:border-gray-950 w-16 py-2 px-3 outline-none rounded-md text-sm shadow-sm shadow-gray-100"
                    value={value.pageCount}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        pageCount: Number(e.target.value),
                      })
                    }
                  />

                  <div className="text-sm text-dark-400 pt-2 font-light">
                    목록 하단, 페이지를 이동하는 링크 수를 지정할 수 있습니다.
                    (기본 5개)
                  </div>
                </div>
              </div>
              <div className="col-span-2 grid grid-cols-3 gap-6 hover:bg-gray-50 p-5">
                <div className="col-span-3 sm:col-span-2">
                  <label htmlFor="documentLike">
                    <div className="text-sm text-black mb-3">좋아요 사용</div>
                  </label>
                  <label className="m-0">
                    <input
                      type="checkbox"
                      name="documentLike"
                      id="documentLike"
                      className="peer hidden"
                      checked={value.documentLike} // state와 연결
                      onChange={
                        (e) =>
                          onChange({ ...value, documentLike: e.target.checked }) // 체크 상태 반영
                      }
                    />

                    <div className="block relative rounded-full cursor-pointer bg-gray-200 w-12 h-6 after:content-[''] after:absolute top-[1px] after:rounded-full after:h-6 after:w-6 after:shadow-md after:bg-white dark:after:bg-white after:transition-all peer-checked:bg-cyan-500 after:peer-checked:translate-x-6"></div>
                  </label>
                  <div className="text-sm text-dark-400 pt-2 font-light">
                    게시글 본문에 좋아요 기능을 사용합니다.
                  </div>
                </div>
              </div>
              <div className="col-span-2 grid grid-cols-3 gap-6 hover:bg-gray-50 p-5">
                <div className="col-span-3 sm:col-span-2">
                  <label htmlFor="consultingState">
                    <div className="text-sm text-black mb-3">
                      상담 기능 사용
                    </div>
                  </label>
                  <label className="m-0">
                    <input
                      type="checkbox"
                      name="consultingState"
                      id="consultingState"
                      className="peer hidden"
                      checked={value.consultingState} // state와 연결
                      onChange={
                        (e) =>
                          onChange({
                            ...value,
                            consultingState: e.target.checked,
                          }) // 체크 상태 반영
                      }
                    />

                    <div className="block relative rounded-full cursor-pointer bg-gray-200 w-12 h-6 after:content-[''] after:absolute top-[1px] after:rounded-full after:h-6 after:w-6 after:shadow-md after:bg-white dark:after:bg-white after:transition-all peer-checked:bg-cyan-500 after:peer-checked:translate-x-6"></div>
                  </label>
                  <div className="text-sm text-dark-400 pt-2 font-light">
                    관리자와 자신이 쓴 글만 보이도록 하는 기능입니다. &#40;회원
                    전용&#41;
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

export default PostInfo;
