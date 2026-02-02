"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { usePostContext } from "./PostProvider";
import { useUser } from "@plextype/hooks/auth/useAuth";
import PostNotPermission from "@/extentions/posts/templates/default/notPermission";

// ✅ TipTap 변환 관련 임포트 추가
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Image } from "@tiptap/extension-image";
import { Link as TiptapLink } from "@tiptap/extension-link";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Highlight } from "@tiptap/extension-highlight";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";

dayjs.extend(relativeTime);

// ✅ 에디터와 동일한 익스텐션 구성 및 스타일 클래스 주입
const tiptapExtensions = [
  StarterKit.configure({
    code: {
      HTMLAttributes: {
        class: 'bg-teal-100 text-teal-600 px-1.5 py-0.5 rounded-md font-mono text-[0.9em] font-medium',
      },
    },
    blockquote: {
      HTMLAttributes: {
        class: 'border-l-4 border-gray-300 pl-4 italic text-gray-600',
      },
    },
    codeBlock: {
      HTMLAttributes: {
        class: 'rounded-md bg-gray-100 text-gray-600 p-4 font-mono text-sm my-4',
      },
    },
    bulletList: false,
    orderedList: false,
  }),

  BulletList.configure({
    HTMLAttributes: { class: 'list-disc ml-6' },
  }),
  OrderedList.configure({
    HTMLAttributes: { class: 'list-decimal ml-6' },
  }),
  ListItem,

  Underline,
  Highlight.configure({ multicolor: true }),
  TiptapLink.configure({
    openOnClick: true,
    HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer' }
  }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
  Image,
];

interface Participant {
  id: number;
  nickName: string;
  profileImage?: string;
}

interface PostsReadProps {
  document: any;
  participants?: Participant[];
}

const EditorJsRenderer = ({ block }: { block: any }) => {
  switch (block.type) {
    case "header": {
      const Tag: any = `h${block.data.level ?? 2}`;
      return <Tag className="font-bold text-gray-900 mt-6 mb-2" dangerouslySetInnerHTML={{ __html: block.data.text }} />;
    }
    case "paragraph":
      return <p className="leading-7 mb-4 text-zinc-800" dangerouslySetInnerHTML={{ __html: block.data.text }} />;
    case "list": {
      const ListTag = block.data.style === "ordered" ? "ol" : "ul";
      const listClass = block.data.style === "ordered" ? "list-decimal pl-5 space-y-2" : "list-disc pl-5 space-y-2";
      return (
        <ListTag className={listClass}>
          {block.data.items.map((item: string, i: number) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ListTag>
      );
    }
    case "image":
      return (
        <figure className="my-8">
          <img src={block.data.file?.url || block.data.url} alt="" className="rounded-2xl mx-auto shadow-sm border border-zinc-100" />
          {block.data.caption && <figcaption className="text-center text-sm text-zinc-400 mt-3">{block.data.caption}</figcaption>}
        </figure>
      );
    default:
      return null;
  }
};

const PostsRead = ({ document, participants = [] }: PostsReadProps) => {
  const { postInfo, permissions } = usePostContext();
  const { data: user } = useUser();

  const renderContent = useMemo(() => {
    let rawContent = document.content || "";

    if (rawContent.startsWith('"') && rawContent.endsWith('"')) {
      rawContent = rawContent.slice(1, -1);
    }

    if (!rawContent) return null;

    try {
      const jsonContent = JSON.parse(rawContent);

      // A: TipTap 데이터인 경우
      if (jsonContent.type === "doc") {
        const html = generateHTML(jsonContent, tiptapExtensions);

        // 정렬 기능(style 속성)을 허용하도록 sanitize 설정
        const cleanHtml = DOMPurify.sanitize(html, {
          ADD_ATTR: ['style', 'target', 'class', 'rel'],
          ADD_TAGS: ['mark']
        });
        return (
          <div
            className="prose prose-zinc max-w-none dark:prose-invert
                 /* ✅ 리스트 스타일 강제 복구 */
                 prose-ul:list-disc prose-ul:ml-6 prose-ul:my-4
                 prose-ol:list-decimal prose-ol:ml-6 prose-ol:my-4
                 prose-li:my-1
                 /* ✅ 인라인 코드: 백틱 제거 및 스타일 */
                 prose-code:before:content-none prose-code:after:content-none
                 prose-code:bg-zinc-100 prose-code:text-[#eb5757] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md
                 /* ✅ 형광펜(mark) 투명화 (인라인 스타일 적용을 위해) */
                 prose-mark:bg-transparent
                 /* ✅ 인용구 및 기타 */
                 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic
                 prose-pre:bg-gray-900 prose-pre:text-white prose-pre:p-0"
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
          />
        );
      }

      // B: 기존 EditorJS 데이터인 경우
      if (jsonContent.blocks) {
        return (
          <div className="post-blocks space-y-4">
            {jsonContent.blocks.map((block: any) => (
              <EditorJsRenderer key={block.id || Math.random()} block={block} />
            ))}
          </div>
        );
      }
    } catch (e) {
      return (
        <div
          className="prose prose-zinc max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: rawContent }}
        />
      );
    }

    return <div dangerouslySetInnerHTML={{ __html: rawContent }} />;
  }, [document.content]);

  if (!permissions.doRead) return <PostNotPermission />;

  console.log(document)

  return (
    <>
      <div className="max-w-screen-xl mx-auto px-3">
        <div className="mx-auto max-w-screen-md pt-10">
          <div className="flex items-center gap-2">
            <Link href={`/posts/${postInfo.pid}`} className="hover:bg-gray-200/50 rounded-lg py-1.5 px-1.5">
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
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </Link>
          </div>
          <div className="hidden pt-12">
            <div className="text-[13px] text-black dark:text-white">
              {document.category?.title}
            </div>
          </div>
          <div className="flex justify-center pb-12 pt-12">
            <div
              className="inline-block text-3xl md:text-4xl font-medium text-black dark:text-white leading-10"
              style={{ lineHeight: "140%" }}
            >
              {document.title}
            </div>
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
                <div className="text-xs text-gray-500">{document.readCount}</div>
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
                  {participants.length}명의 사람들이 이 토론에 참여하였습니다.
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
      <div className="postContent mx-auto max-w-screen-md px-3 py-6 lg:py-10 text-base font-normal text-gray-800 dark:text-dark-400">
        {renderContent}
      </div>
      <div className="flex justify-end gap-2 mx-auto max-w-screen-md py-8">
        <Link
          href={`/posts/${postInfo.pid}`}
          className="text-xs bg-gray-50 py-1.5 px-6 border border-gray-100 text-gray-800 hover:text-gray-950 hover:bg-gray-100 focus:border-gray-900 rounded-full "
        >
          목록
        </Link>
        {
          (user?.id === document.userId) ? (
            <>
              <Link
                href={`/posts/${postInfo.pid}/${document.id}/edit`}
                className="text-xs bg-gray-50 py-1.5 px-6  border border-gray-100 text-gray-800 hover:text-gray-950 hover:bg-gray-100 focus:border-gray-900 rounded-full "
              >
                수정
              </Link>
              <Link
                href={`/posts/${postInfo.pid}/${document.id}/delete`}
                className="text-xs bg-gray-50 py-1.5 px-6 border border-gray-100 text-gray-800 hover:text-gray-950 hover:bg-gray-100 focus:border-gray-900 rounded-full "
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
