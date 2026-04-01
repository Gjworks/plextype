"use client";

import React from "react";
// 💡 1. 짭(?) 타입 선언은 지우고, 근본 있는 공통 타입을 불러옵니다!
import type { PostInfoData } from "@modules/posts/_actions/_type";
// 💡 2. 공용 InputField 컴포넌트 호출
import InputField from "@components/form/InputField";

type PostInfoProps = {
  id?: string;
  value: PostInfoData;
  onChange: (val: PostInfoData) => void;
};


const PostInfo: React.FC<PostInfoProps> = ({ id, value, onChange }) => {

  // 💡 핵심: 모든 InputField의 변화를 감지하여 부모에게 보고합니다.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value: inputValue, type, checked } = e.target;
    console.log("필드명:", name, "입력값:", inputValue);
    const finalValue = type === "number" ? Number(inputValue) : (type === "checkbox" ? checked : inputValue);

    // 💡 부모에게 한 조각만 보고 (as any로 타입 잠시 우회)
    onChange({ [name]: finalValue } as any);
  };

  return (
    <>
      {id && <input type="hidden" name="postId" value={id} />}
      <input type="hidden" name="moduleType" value="posts" />
      <div className="">
        <div className="grid grid-cols-4 gap-8 py-10">
          <div className="col-span-1">
            <div className="text-lg font-semibold text-gray-600 mb-3">
              게시판 기본설정
            </div>
            <div className="text-gray-400 text-sm">
              게시판의 기본설정을 입력합니다.
            </div>
          </div>
          <div className="col-span-3">
            <div className="grid grid-col-span-2">

              {/* 🌟 1. 모듈 ID (UpsertForm 패턴: defaultValue 사용) */}
              <div className="col-span-2 grid grid-cols-3 gap-6 hover:bg-gray-50 p-5">
                <div className="col-span-3 sm:col-span-2">
                  <InputField
                    inputTitle="모듈ID"
                    name="mid"
                    type="text"
                    placeholder="/?mid=post"
                    // 💡 value 대신 defaultValue를 써서 인풋의 통제권을 브라우저에게 살짝 넘깁니다.
                    value={value.mid || ""}
                    onChange={handleInputChange}
                    // readOnly={!!id && id !== "create"} // 수정 모드일 때 ID 수정 불가하게 하려면 활성화
                  />
                </div>
              </div>

              {/* 🌟 2. 게시판 이름 */}
              <div className="col-span-2 grid grid-cols-3 gap-6 hover:bg-gray-50 p-5">
                <div className="col-span-3 sm:col-span-2">
                  <InputField
                    inputTitle="게시판이름"
                    name="moduleName"
                    type="text"
                    value={value.moduleName || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* 🌟 3. 목록 수 */}
              <div className="col-span-2 grid grid-cols-3 gap-6 hover:bg-gray-50 p-5">
                <div className="col-span-3 sm:col-span-2">
                  <InputField
                    inputTitle="목록 수"
                    name="listCount"
                    type="number"
                    value={value.config.listCount}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* 🌟 4. 페이지 수 */}
              <div className="col-span-2 grid grid-cols-3 gap-6 hover:bg-gray-50 p-5">
                <div className="col-span-3 sm:col-span-2">
                  <InputField
                    inputTitle="페이지 수"
                    name="pageCount"
                    type="number"
                    value={value.config.pageCount}
                    onChange={handleInputChange}
                  />
                </div>
              </div>


              {/* 💡 아래 토글 스위치들은 예쁜 커스텀 디자인 유지를 위해 기존 코드 보존! */}
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
                      checked={value.config.documentLike}
                      onChange={(e) =>
                        onChange({
                          ...value,             // 1. 큰 상자(PostInfoData)의 모든 내용물을 복사한다.
                          config: {             // 2. 그 중 config라는 작은 상자만 새로 정의한다.
                            ...value.config,    // 3. 기존 config 내용물을 복사하고
                            documentLike: e.target.checked, // 4. 바뀐 값만 덮어씌운다.
                          },
                        })
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
                      checked={value.config.consultingState}
                      onChange={(e) =>
                        onChange({
                          ...value, // 1. 기존 데이터 전체를 복사하고
                          config: {
                            ...value.config, // 2. 기존 config를 복사한 뒤
                            consultingState: e.target.checked // 3. 그 안의 값만 교체!
                          },
                        })
                      }
                    />
                    <div className="block relative rounded-full cursor-pointer bg-gray-200 w-12 h-6 after:content-[''] after:absolute top-[1px] after:rounded-full after:h-6 after:w-6 after:shadow-md after:bg-white dark:after:bg-white after:transition-all peer-checked:bg-cyan-500 after:peer-checked:translate-x-6"></div>
                  </label>
                  <div className="text-sm text-dark-400 pt-2 font-light">
                    관리자와 자신이 쓴 글만 보이도록 하는 기능입니다. &#40;회원 전용&#41;
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