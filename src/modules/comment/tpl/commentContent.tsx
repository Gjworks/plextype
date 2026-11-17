import DOMPurify from "isomorphic-dompurify";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { Link as TiptapLink } from "@tiptap/extension-link";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Highlight } from "@tiptap/extension-highlight";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";

const commentExtensions = [
  StarterKit.configure({
    code: { HTMLAttributes: { class: "bg-teal-100 text-teal-600 px-1.5 py-0.5 rounded-md font-mono text-[0.9em] font-medium" } },
    blockquote: { HTMLAttributes: { class: "border-l-4 border-gray-300 pl-4 italic text-gray-600 dark:border-dark-700 dark:text-dark-300" } },
    bulletList: false,
    orderedList: false,
  }),
  BulletList.configure({ HTMLAttributes: { class: "list-disc ml-6" } }),
  OrderedList.configure({ HTMLAttributes: { class: "list-decimal ml-6" } }),
  ListItem,
  Underline,
  Highlight.configure({ multicolor: true }),
  TiptapLink.configure({ openOnClick: true, HTMLAttributes: { class: "text-blue-600 underline cursor-pointer" } }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Image,
];

// 에디터로 쓴 댓글(JSON)은 HTML로 바꿔 소독하고, 예전의 일반 글 댓글은 글자 그대로 보여준다.
export default function CommentContent({ content }: { content: string }) {
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);
    if (parsed?.type === "doc") {
      const cleanHtml = DOMPurify.sanitize(generateHTML(parsed, commentExtensions), {
        ADD_ATTR: ["style", "target", "class", "rel"],
        ADD_TAGS: ["mark"],
      });
      return (
        <div
          className="prose prose-zinc prose-sm max-w-none dark:prose-invert prose-p:my-1 dark:prose-p:text-dark-200 dark:prose-li:text-dark-200 prose-pre:bg-gray-50 prose-pre:text-gray-700 prose-img:rounded-sm prose-img:border prose-img:border-gray-200 dark:prose-pre:bg-dark-900 dark:prose-pre:text-dark-200 dark:prose-img:border-dark-800"
          dangerouslySetInnerHTML={{ __html: cleanHtml }}
        />
      );
    }
  } catch {
    return <>{content}</>;
  }

  return <>{content}</>;
}
