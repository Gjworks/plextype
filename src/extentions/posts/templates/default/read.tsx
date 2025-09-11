"use client";

import { useRouter } from "next/navigation";
import type { OutputData } from "@editorjs/editorjs";
import EditorJsRenderer from "editorjs-react-renderer";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {usePostContext} from "./PostProvider";
import { useUser } from "@plextype/hooks/auth/useAuth";
import PostNotPermission from "@/extentions/posts/templates/default/notPermission";
dayjs.extend(relativeTime); // ← 반드시 플러그인 확장

const PostsRead = ({ document }) => {
  const router = useRouter();
  const { postInfo } = usePostContext();
  const { data: user, isError } = useUser();
  console.log(JSON.stringify(user))
  const contentData = JSON.parse(document.content);

  const { permissions } = usePostContext();

  if (!permissions.doRead) {
    return <PostNotPermission/>;
  }

  return (
    <>
      <div className="max-w-screen-xl mx-auto px-3">
        <div className="mx-auto max-w-screen-md py-20">
          <div className="text-center">
            <div className="text-sm mb-4 text-gray-400">{document.category?.title ?? ""}</div>
            <h1
              className="inline-block text-3xl md:text-4xl font-medium text-black py-4 dark:text-white text-center leading-10"
              style={{lineHeight: "140%"}}
            >
              {document.title}
            </h1>
          </div>
        </div>
        <div className="mx-auto max-w-screen-md">
          <div className="flex items-center justify-between gap-8 pt-5 pb-3 px-3">
            <div className="flex items-center gap-4">
              <div className="">
                <div
                  className="dark:bg-dark-800 dark:hover:bg-dark-700 h-10 w-10 rounded-full bg-gray-200 hover:bg-gray-100"></div>
              </div>
              <div>
                <div className="flex gap-2">
                  <div className="line-clamp-1 text-sm font-semibold text-black dark:text-white">
                    {document.user.nickName}
                  </div>
                  <button
                    className="line-clamp-1 text-xs font-light text-secondary-500 hover:secondary-600 dark:text-white">
                    Follow +
                  </button>
                </div>
                <div className="flex gap-2">
                  <div className="dark:text-dark-400 text-sm font-light text-gray-500">
                    {document.category?.title ?? ""}
                  </div>
                  <div className="flex gap-1 items-center">
                    <span className="w-[3px] h-[3px] rounded-full bg-gray-400"></span>
                  </div>
                  <div className="flex gap-2">
                    <div className="dark:text-dark-400 text-sm font-light text-gray-500">
                      조회수
                    </div>
                    <div className="dark:text-dark-400 text-sm font-light text-gray-500">
                      {document.readCount}
                    </div>
                  </div>
                  <div className="flex gap-1 items-center">
                    <span className="w-[3px] h-[3px] rounded-full bg-gray-400"></span>
                  </div>
                  <div className="dark:text-dark-400 text-sm font-light text-gray-500">
                    {dayjs(document.createdAt).fromNow()}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            className="flex items-center gap-4 justify-between border-t border-b border-gray-100 dark:border-dark-800 py-2">
            <div className="flex gap-4 px-3">
              <div className="flex gap-1 items-center">
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                </div>
                <div className="text-xs text-gray-500">1232</div>
              </div>
              <div className="flex gap-1 items-center">
                <div className=" dark:text-dark-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                    />
                  </svg>
                </div>
                <div className="text-xs text-gray-500 dark:text-dark-500">
                  {document.commentCount}
                </div>
              </div>

              <div className="flex gap-1">
                <div className="flex items-center">
                  <span className="w-5 h-5 bg-gray-500 dark:bg-dark-400 rounded-full inline"></span>
                  <span className="w-5 h-5 bg-gray-400 dark:bg-dark-500 rounded-full inline -ml-2"></span>
                  <span className="w-5 h-5 bg-gray-300 dark:bg-dark-600 rounded-full inline -ml-2"></span>
                  <span className="w-5 h-5 bg-gray-200 dark:bg-dark-700 rounded-full inline -ml-2"></span>
                  <span className="w-5 h-5 bg-gray-100 dark:bg-dark-800 rounded-full inline -ml-2"></span>
                  <span className="-ml-2 text-gray-500 hover:text-primary-600 cursor-pointer">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                  </span>
                </div>
                <div className="dark:text-dark-400 text-sm font-light text-gray-500">
                  6명의 사람들이 이 토론에 참여하였습니다.
                </div>
              </div>

            </div>
            <div>
              <div className="flex items-center gap-2 lg:gap-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300/75 bg-white dark:bg-dark-800 dark:text-dark-500 dark:border-dark-600">
                  <div className="">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                      />
                    </svg>
                  </div>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300/75 bg-white dark:bg-dark-800 dark:text-dark-500 dark:border-dark-600">
                  <div className="">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-screen-md px-3 py-6 lg:py-10">
        {contentData.blocks.map((block: any) => {
          if (block.type === "paragraph") {
            return (
              <p
                key={block.id}
                dangerouslySetInnerHTML={{__html: block.data.text}}
              />
            );
          }
          return null;
        })}
      </div>
      <div className="flex justify-end gap-2 mx-auto max-w-screen-md py-8">
        <Link
          href={`/posts/${postInfo.pid}`}
          className="text-sm py-1 px-4 rounded-sm bg-gray-100 text-gray-600"
        >
          목록
        </Link>
        {
          (user?.id === document.userId) ? (
             <>
               <Link
                 href={`/posts/${postInfo.pid}/edit/${document.id}`}
                 className="text-sm py-1 px-4 rounded-sm bg-yellow-100 text-amber-600"
               >
                 수정
               </Link>
               <button
                 type="button"
                 // onClick={() => handleDelete(document.id)}
                 className="text-sm py-1 px-4 rounded-sm bg-red-100 text-red-600"
               >
                 삭제
               </button>

             </>
          ) : null
        }
      </div>
        <div className="dark:bg-dark-900 border-t border-gray-100 dark:border-dark-800"></div>
        <div className="mx-auto max-w-screen-md px-3 pt-10">
          <div className="mb-5 text-lg text-black dark:text-white">
            Comments (6)
          </div>
          <div
            className="dark:bg-dark-900 dark:shadow-dark-950 dark:border-dark-700/90 dark:border-t-dark-600/60 relative w-full overflow-hidden rounded-xl border border-gray-200/75 bg-gray-100 p-5 shadow-lg shadow-gray-100/90 backdrop-blur-xl h-full">
            <div className="">
            <textarea
              className="w-full outline-none text-sm text-gray-900 dark:text-white rounded-xl p-5 dark:bg-dark-950 dark:border-dark-950 dark:border dark:hover:border-primary-600"
              rows={4}
              placeholder="Generate a project kickoff presentation for /meeting"
            ></textarea>
            </div>
            <div className="flex justify-between gap-4 pt-2 px-3">
              <div className="flex gap-8">
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.25}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                  </svg>
                </div>
              </div>
              <div className="">
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.25}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="pb-20">
            <div className="dark:border-dark-800 border-b border-gray-200 py-10">
              <div className="flex gap-4">
                <div className="dark:bg-dark-700 h-10 w-10 rounded-full bg-gray-200"></div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-4">
                    <div className="dark:text-dark-100 text-base font-semibold text-gray-700">
                      Coreamericano
                    </div>
                    <div className="dark:text-dark-500 text-xs text-gray-400">
                      1일전
                    </div>
                  </div>
                  <div className="dark:text-dark-400 text-sm font-light text-gray-500">
                    involves capturing the rendered output of a component and
                    saving it to a snapshot file. When tests run, the current
                    rendered output of the component is compared against the saved
                    snapshot. Changes in the snapshot are used to indicate
                    unexpected changes in behavior.
                  </div>
                  <div className="flex items-center justify-between gap-4 pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-xs">
                        <div className="text-rose-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-5 w-5"
                          >
                            <path
                              d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/>
                          </svg>
                        </div>
                        <div className="dark:text-dark-500 text-gray-400">
                          56 Likes
                        </div>
                      </div>

                      <div className="dark:text-dark-500 text-xs text-gray-400">
                        Reply
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="dark:text-dark-500 text-xs text-gray-400">
                        Modify
                      </div>
                      <div className="dark:text-dark-500 text-xs text-gray-400">
                        Delete
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex gap-4 pl-12 pt-10">
                  <div className="dark:bg-dark-700 h-8 w-8 rounded-full bg-gray-200"></div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-4">
                      <div className="dark:text-dark-100 text-base font-semibold text-gray-700">
                        Coreamericano
                      </div>
                      <div className="dark:text-dark-500 text-xs text-gray-400">
                        1일전
                      </div>
                    </div>
                    <div className=" dark:text-dark-400 text-sm font-light text-gray-500">
                      Since async Server Components are new to the React
                      ecosystem, some tools do not fully support them. In the
                      meantime, we recommend using End-to-End Testing over Unit
                      Testing for async components.
                    </div>
                    <div className="flex items-center gap-4 pt-6">
                      <div className="dark:text-dark-500 flex items-center gap-1 text-xs text-gray-400">
                        <div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1}
                            stroke="currentColor"
                            className="h-5 w-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                            />
                          </svg>
                        </div>
                        <div>56 Likes</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pl-12 pt-10">
                  <div className="dark:bg-dark-700 h-8 w-8 rounded-full bg-gray-200"></div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-4">
                      <div className="dark:text-dark-100 text-base font-semibold text-gray-700">
                        Coreamericano
                      </div>
                      <div className="dark:text-dark-500 text-xs text-gray-400">
                        1일전
                      </div>
                    </div>
                    <div className=" dark:text-dark-400 text-sm font-light text-gray-500">
                      Since async Server Components are new to the React
                      ecosystem, some tools do not fully support them. In the
                      meantime, we recommend using End-to-End Testing over Unit
                      Testing for async components.
                    </div>
                    <div className="flex items-center gap-4 pt-6">
                      <div className="dark:text-dark-500 flex items-center gap-1 text-xs text-gray-400">
                        <div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1}
                            stroke="currentColor"
                            className="h-5 w-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                            />
                          </svg>
                        </div>
                        <div>56 Likes</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="py-10">
              <div className="flex gap-4">
                <div className="dark:bg-dark-700 h-10 w-10 rounded-full bg-gray-200"></div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-4">
                    <div className="dark:text-dark-100 text-base font-semibold text-gray-700">
                      Coreamericano
                    </div>
                    <div className="dark:text-dark-500 text-xs text-gray-400">
                      1일전
                    </div>
                  </div>
                  <div className=" dark:text-dark-400 text-sm font-light text-gray-500">
                    involves capturing the rendered output of a component and
                    saving it to a snapshot file. When tests run, the current
                    rendered output of the component is compared against the saved
                    snapshot. Changes in the snapshot are used to indicate
                    unexpected changes in behavior.
                  </div>
                  <div className="flex items-center gap-4 pt-6">
                    <div className="dark:text-dark-500 flex items-center gap-1 text-xs text-gray-400">
                      <div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1}
                          stroke="currentColor"
                          className="h-5 w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                          />
                        </svg>
                      </div>
                      <div>56 Likes</div>
                    </div>
                    <div className="text-dark-500 text-xs">Reply</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
      );
      };

export default PostsRead;
