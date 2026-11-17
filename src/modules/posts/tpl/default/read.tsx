import React from "react";
import DOMPurify from "isomorphic-dompurify";
import PostNotPermission from "@/modules/posts/tpl/default/notPermission";
import CodeBlockShiki from 'tiptap-extension-code-block-shiki'
import BoardReadActions from "./boardReadActions";
import BoardAdjacentPosts from "./boardAdjacentPosts";
import PostContentStyles from "./contentStyles";
import BoardRead from "./boardRead";
import { codeToHtml } from "shiki";

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

const SHIKI_THEME = 'slack-ochin';

// 다크 모드의 코드 글자색. 다른 테마로 바꾸면 키·문자열의 색 계열이 통째로 달라지므로,
// 라이트 테마의 색상(hue)은 그대로 두고 어두운 배경에서 읽히도록 밝기만 올린다.
const toDarkCodeColor = (hex: string) => {
  const value = hex.replace('#', '').slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }
  const saturation = delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0;
  // 본문색처럼 아주 어두운 색은 색조를 거의 빼서 밝은 회색으로, 나머지는 채도를 조금 낮춰 파스텔 톤으로 만든다.
  const nextSaturation = lightness < 0.2 ? saturation * 0.18 : Math.min(saturation, 0.85) * 0.82;
  const nextLightness = lightness < 0.2 ? 0.86 : 0.68 + lightness * 0.16;
  return `hsl(${Math.round(((hue * 60) + 360) % 360)} ${Math.round(nextSaturation * 100)}% ${Math.round(nextLightness * 100)}%)`;
};

const withDarkCodeColors = (html: string) =>
  html.replace(/--shiki-dark:(#[0-9a-fA-F]{6,8})/g, (_match, hex: string) => `--shiki-dark:${toDarkCodeColor(hex)}`);

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const highlightCodeBlocks = async (html: string) => {
  const codeBlockRegex = /<pre\b[^>]*>\s*<code\b([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/g;
  const matches = [...html.matchAll(codeBlockRegex)];

  if (matches.length === 0) return html;

  let highlightedHtml = html;

  for (const match of matches) {
    const codeAttrs = match[1] || "";
    const language = codeAttrs.match(/language-([A-Za-z0-9_-]+)/)?.[1] || 'typescript';
    const code = decodeHtmlEntities(match[2]);
    let shikiHtml: string;

    try {
      shikiHtml = await codeToHtml(code, {
        lang: language,
        themes: { light: SHIKI_THEME, dark: SHIKI_THEME },
      });
    } catch {
      shikiHtml = await codeToHtml(code, {
        lang: 'text',
        themes: { light: SHIKI_THEME, dark: SHIKI_THEME },
      });
    }

    const styledHtml = withDarkCodeColors(shikiHtml).replace('<pre class="', '<pre class="plextype-shiki-block ');

    highlightedHtml = highlightedHtml.replace(match[0], styledHtml);
  }

  return highlightedHtml;
};

// ✅ 에디터와 동일한 익스텐션 구성 및 스타일 클래스 주입
const tiptapExtensions = [
  StarterKit.configure({
    codeBlock: false,
    code: {
      HTMLAttributes: {
        class: 'bg-teal-100 text-teal-600 px-1.5 py-0.5 rounded-md font-mono text-[0.9em] font-medium',
      },
    },
    blockquote: {
      HTMLAttributes: {
        class: 'border-l-4 border-gray-300 pl-4 italic text-gray-600 dark:border-dark-700 dark:text-dark-300',
      },
    },
    bulletList: false,
    orderedList: false,
  }),
  CodeBlockShiki.configure({
    defaultTheme: SHIKI_THEME,
    defaultLanguage: 'typescript',
    HTMLAttributes: {
      class: 'plextype-shiki-block',
    },
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
  profile?: {
    profileImage?: string | null;
  } | null;
}

interface PostsReadProps {
  Presentation?: React.ComponentType<any>;
  comments?: React.ReactNode;
  document: any;
  participants?: Participant[];
  postInfo: any;
  permissions: {
    doList: boolean;
    doRead: boolean;
    doWrite: boolean;
    doComment: boolean;
  };
  currentUser: any;
}

const PostsRead = async ({ document, participants = [], postInfo, permissions, currentUser, Presentation, comments }: PostsReadProps) => {

  const renderContent = async () => {
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
        const highlightedHtml = await highlightCodeBlocks(html);

        // 정렬 기능(style 속성)을 허용하도록 sanitize 설정
        const cleanHtml = DOMPurify.sanitize(highlightedHtml, {
          ADD_ATTR: ['style', 'target', 'class', 'rel'],
          ADD_TAGS: ['mark']
        });

        return (
          <div
            className="prose prose-zinc max-w-none dark:prose-invert
               prose-p:leading-8 prose-p:text-gray-700 dark:prose-p:text-dark-200
               prose-headings:text-gray-950 dark:prose-headings:text-dark-100
               prose-strong:text-gray-950 dark:prose-strong:text-dark-100
               prose-li:text-gray-700 dark:prose-li:text-dark-200
               prose-a:text-blue-600 dark:prose-a:text-sky-400
               prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0"
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
          />
        );
      }

      if (jsonContent.blocks) return null;
    } catch (e) {
      const cleanHtml = DOMPurify.sanitize(rawContent, {
        ADD_ATTR: ['style', 'target', 'class', 'rel'],
        ADD_TAGS: ['mark']
      });

      return (
        <div
          className="prose prose-zinc max-w-none dark:prose-invert prose-p:leading-8 prose-p:text-gray-700 dark:prose-p:text-dark-200 prose-headings:text-gray-950 dark:prose-headings:text-dark-100 prose-strong:text-gray-950 dark:prose-strong:text-dark-100 prose-li:text-gray-700 dark:prose-li:text-dark-200 prose-a:text-blue-600 dark:prose-a:text-sky-400"
          dangerouslySetInnerHTML={{ __html: cleanHtml }}
        />
      );
    }

    const cleanHtml = DOMPurify.sanitize(rawContent, {
      ADD_ATTR: ['style', 'target', 'class', 'rel'],
      ADD_TAGS: ['mark']
    });

    return <div className="text-gray-700 dark:text-dark-200" dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
  };

  if (!permissions.doRead) return <PostNotPermission />;
  const content = await renderContent();

  if (Presentation) return <>
    <PostContentStyles />
    <Presentation document={document} postInfo={postInfo} participants={participants} currentUser={currentUser} comments={comments} content={<div key="content">{content}</div>}
      navigation={<BoardAdjacentPosts key="navigation" mid={postInfo.mid} slug={document.slug} />}
      actions={<BoardReadActions key="actions" mid={postInfo.mid} slug={document.slug} canEdit={currentUser?.id === document.userId} />} />
  </>;

  return (
    <>
      <PostContentStyles />
      <BoardRead document={document} postInfo={postInfo} content={content} currentUser={currentUser} />
    </>
  );
};

export default PostsRead;
