import prisma from "@/core/utils/db/prisma";
import type { SearchProvider, SearchResultItem } from "./search.types";
import { extensionSearchProviders } from "@extensions/searchProviders";

const collectJsonText = (node: unknown): string[] => {
  if (!node) return [];
  if (typeof node === "string" || typeof node === "number") return [String(node)];
  if (Array.isArray(node)) return node.flatMap(collectJsonText);
  if (typeof node !== "object") return [];

  const record = node as Record<string, unknown>;
  const text = typeof record.text === "string" ? [record.text] : [];
  const content = Array.isArray(record.content) ? record.content.flatMap(collectJsonText) : [];

  return [...text, ...content];
};

const jsonToPlainText = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || (trimmed[0] !== "{" && trimmed[0] !== "[")) return "";

  try {
    return collectJsonText(JSON.parse(trimmed)).join(" ");
  } catch {
    return "";
  }
};

const stripHtml = (value?: string | null) => {
  if (!value) return "";
  const jsonText = jsonToPlainText(value);
  const source = jsonText || value;

  return source
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
};

const createExcerpt = (value?: string | null, length = 120) => {
  const plainText = stripHtml(value);
  if (plainText.length <= length) return plainText;
  return `${plainText.slice(0, length).trim()}...`;
};

const toIsoString = (value?: Date | null) => value ? value.toISOString() : undefined;

const coreSearchProviders: SearchProvider[] = [
  {
    key: "document",
    label: "문서",
    enabled: true,
    source: "core",
    order: 10,
    limit: 6,
    async search({ query, limit }) {
      const items = await prisma.document.findMany({
        where: {
          isSecrets: false,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
            { authorName: { contains: query, mode: "insensitive" } },
          ],
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          content: true,
          authorName: true,
          createdAt: true,
          module: { select: { mid: true, moduleName: true } },
          user: { select: { nickName: true } },
        },
      });

      return items.map<SearchResultItem>((item) => ({
        id: String(item.id),
        type: "document",
        title: item.title || "제목 없음",
        excerpt: createExcerpt(item.content),
        href: item.module?.mid ? `/posts/${item.module.mid}/${item.slug}` : `/posts/${item.slug}`,
        module: item.module?.moduleName || item.module?.mid,
        authorName: item.user?.nickName || item.authorName || undefined,
        createdAt: toIsoString(item.createdAt),
      }));
    },
  },
  {
    key: "comment",
    label: "댓글",
    enabled: true,
    source: "core",
    order: 20,
    limit: 6,
    async search({ query, limit }) {
      const items = await prisma.comment.findMany({
        where: {
          isDeleted: false,
          isSecret: false,
          content: { contains: query, mode: "insensitive" },
          document: { isSecrets: false },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          content: true,
          authorName: true,
          createdAt: true,
          user: { select: { nickName: true } },
          document: {
            select: {
              slug: true,
              title: true,
              module: { select: { mid: true, moduleName: true } },
            },
          },
        },
      });

      return items.map<SearchResultItem>((item) => ({
        id: String(item.id),
        type: "comment",
        title: item.document.title || "댓글",
        excerpt: createExcerpt(item.content),
        href: item.document.module?.mid ? `/posts/${item.document.module.mid}/${item.document.slug}#comment-${item.id}` : `/posts/${item.document.slug}#comment-${item.id}`,
        module: item.document.module?.moduleName || item.document.module?.mid,
        authorName: item.user?.nickName || item.authorName || undefined,
        createdAt: toIsoString(item.createdAt),
      }));
    },
  },
  {
    key: "attachment",
    label: "첨부파일",
    enabled: true,
    source: "core",
    order: 30,
    limit: 6,
    async search({ query, limit }) {
      const items = await prisma.attachment.findMany({
        where: {
          OR: [
            { originalName: { contains: query, mode: "insensitive" } },
            { fileName: { contains: query, mode: "insensitive" } },
            { mimeType: { contains: query, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          originalName: true,
          fileName: true,
          mimeType: true,
          size: true,
          path: true,
          createdAt: true,
          uploadedBy: { select: { nickName: true } },
        },
      });

      return items.map<SearchResultItem>((item) => ({
        id: String(item.id),
        type: "attachment",
        title: item.originalName || item.fileName,
        excerpt: item.mimeType,
        href: item.path,
        authorName: item.uploadedBy?.nickName || undefined,
        createdAt: toIsoString(item.createdAt),
        meta: { size: item.size, mimeType: item.mimeType },
      }));
    },
  },
  {
    key: "user",
    label: "회원",
    enabled: true,
    source: "core",
    order: 40,
    limit: 4,
    async search({ query, limit }) {
      const items = await prisma.user.findMany({
        where: {
          OR: [
            { nickName: { contains: query, mode: "insensitive" } },
            { email_address: { contains: query, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          slug: true,
          nickName: true,
          email_address: true,
          createdAt: true,
          profile: { select: { profileImage: true } },
        },
      });

      return items.map<SearchResultItem>((item) => ({
        id: String(item.id),
        type: "user",
        title: item.nickName,
        excerpt: item.email_address,
        href: `/user?timelineUserId=${item.id}`,
        createdAt: toIsoString(item.createdAt),
        meta: { profileImage: item.profile?.profileImage || null, slug: item.slug },
      }));
    },
  },
];

export const searchProviders = [...coreSearchProviders, ...extensionSearchProviders.map((provider) => ({ ...provider, source: provider.source || "extension" as const }))]
  .filter((provider) => provider.enabled)
  .sort((a, b) => a.order - b.order);
