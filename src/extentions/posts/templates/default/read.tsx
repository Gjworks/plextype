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
                  <div className="dark:text-dark-400 text-sm text-gray-500">
                    {document.category?.title ?? ""}
                  </div>
                  <div className="flex gap-1 items-center">
                    <span className="w-[3px] h-[3px] rounded-full bg-gray-400"></span>
                  </div>
                  <div className="flex gap-2">
                    <div className="dark:text-dark-400 text-sm text-gray-500">
                      조회수
                    </div>
                    <div className="dark:text-dark-400 text-sm text-gray-500">
                      {document.readCount}
                    </div>
                  </div>
                  <div className="flex gap-1 items-center">
                    <span className="w-[3px] h-[3px] rounded-full bg-gray-400"></span>
                  </div>
                  <div className="dark:text-dark-400 text-sm text-gray-500">
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
                <div className="dark:text-dark-400 text-sm text-gray-500">
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
      <div className="postContent mx-auto max-w-screen-md px-3 py-6 lg:py-10 text-base font-normal text-gray-800">
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
          className="text-sm py-1 px-4 rounded-sm bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          목록
        </Link>
        {
          (user?.id === document.userId) ? (
             <>
               <Link
                 href={`/posts/${postInfo.pid}/edit/${document.id}`}
                 className="text-sm py-1 px-4 rounded-sm bg-yellow-100 text-amber-600 hover:bg-yellow-200"
               >
                 수정
               </Link>
               <Link
                 href={`/posts/${postInfo.pid}/view/${document.id}/delete`}
                 className="text-sm py-1 px-4 rounded-sm bg-red-100 text-red-600 hover:bg-red-200"
               >
                 삭제
               </Link>

             </>
          ) : null
        }
      </div>
        <div className="dark:bg-dark-900 border-t border-gray-100 dark:border-dark-800"></div>

      </>
      );
      };

export default PostsRead;
