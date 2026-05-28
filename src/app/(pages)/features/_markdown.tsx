import fs from "fs";
import path from "path";
import React from "react";

import { CodeBlock, DocSection, DocsShell, FeatureDocPanel } from "./_components";

export type FeatureDocSlug =
  | "getting-started"
  | "architecture"
  | "extensions"
  | "layouts"
  | "project-api"
  | "posts"
  | "previews"
  | "operations"
  | "documentation";

export const featureDocSlugs: FeatureDocSlug[] = [
  "getting-started",
  "architecture",
  "extensions",
  "layouts",
  "project-api",
  "posts",
  "previews",
  "operations",
  "documentation",
];

const DOC_HREF_BY_SLUG: Record<FeatureDocSlug, string> = {
  "getting-started": "/features/getting-started",
  architecture: "/features/architecture",
  extensions: "/features/extensions",
  layouts: "/features/layouts",
  "project-api": "/features/project-api",
  posts: "/features/posts",
  previews: "/features/previews",
  operations: "/features/operations",
  documentation: "/features/documentation",
};

type ParsedDoc = {
  title: string;
  description: string;
  sections: Array<{
    title: string;
    blocks: MarkdownBlock[];
  }>;
};

type MarkdownBlock =
  | { type: "paragraph"; content: string }
  | { type: "code"; content: string; language?: string }
  | { type: "list"; items: string[] };

const DOCS_DIR = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  "src",
  "app",
  "(pages)",
  "features",
  "_docs",
);

export const readFeatureDoc = (slug: FeatureDocSlug): ParsedDoc => {
  const filePath = path.join(DOCS_DIR, `${slug}.md`);
  const source = fs.readFileSync(filePath, "utf8");
  return parseMarkdownDoc(source);
};

export const readFeatureDocMeta = (slug: FeatureDocSlug) => {
  const filePath = path.join(DOCS_DIR, `${slug}.md`);
  const source = fs.readFileSync(filePath, "utf8");
  const { frontmatter } = parseFrontmatter(source);

  return {
    href: DOC_HREF_BY_SLUG[slug],
    title: frontmatter.title || slug,
    desc: frontmatter.description || "",
  };
};

export const readFeatureDocsNav = () => featureDocSlugs.map(readFeatureDocMeta);

const parseMarkdownDoc = (source: string): ParsedDoc => {
  const { frontmatter, body } = parseFrontmatter(source);
  const lines = body.split(/\r?\n/);
  const sections: ParsedDoc["sections"] = [];
  let currentSection: ParsedDoc["sections"][number] | null = null;
  let paragraphLines: string[] = [];
  let listItems: string[] = [];
  let codeLines: string[] = [];
  let codeLanguage = "";
  let inCode = false;

  const ensureSection = () => {
    if (!currentSection) {
      currentSection = { title: "문서", blocks: [] };
      sections.push(currentSection);
    }
    return currentSection;
  };

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    ensureSection().blocks.push({
      type: "paragraph",
      content: paragraphLines.join(" ").trim(),
    });
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    ensureSection().blocks.push({
      type: "list",
      items: listItems,
    });
    listItems = [];
  };

  lines.forEach((line) => {
    if (line.startsWith("```")) {
      if (inCode) {
        ensureSection().blocks.push({
          type: "code",
          language: codeLanguage,
          content: codeLines.join("\n"),
        });
        codeLines = [];
        codeLanguage = "";
        inCode = false;
        return;
      }

      flushParagraph();
      flushList();
      inCode = true;
      codeLanguage = line.replace("```", "").trim();
      return;
    }

    if (inCode) {
      codeLines.push(line);
      return;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      currentSection = { title: line.replace(/^##\s+/, "").trim(), blocks: [] };
      sections.push(currentSection);
      return;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      listItems.push(line.replace(/^-\s+/, "").trim());
      return;
    }

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      return;
    }

    flushList();
    paragraphLines.push(line.trim());
  });

  flushParagraph();
  flushList();

  return {
    title: frontmatter.title || "Features",
    description: frontmatter.description || "",
    sections,
  };
};

const parseFrontmatter = (source: string) => {
  if (!source.startsWith("---")) {
    return { frontmatter: {} as Record<string, string>, body: source };
  }

  const endIndex = source.indexOf("\n---", 3);
  if (endIndex === -1) {
    return { frontmatter: {} as Record<string, string>, body: source };
  }

  const rawFrontmatter = source.slice(3, endIndex).trim();
  const body = source.slice(endIndex + 4).trim();
  const frontmatter = Object.fromEntries(
    rawFrontmatter
      .split(/\r?\n/)
      .map((line) => {
        const [key, ...valueParts] = line.split(":");
        return [key.trim(), valueParts.join(":").trim()];
      })
      .filter(([key]) => key),
  );

  return { frontmatter, body };
};

const renderInlineText = (content: string) => {
  const parts = content.split(/(`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={`${part}-${index}`} className="rounded bg-gray-100 px-1.5 py-0.5 text-[0.88em] font-semibold text-gray-800 dark:bg-dark-800 dark:text-dark-100">
          {part.slice(1, -1)}
        </code>
      );
    }

    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
};

export const FeatureMarkdownPage = ({ slug }: { slug: FeatureDocSlug }) => {
  const doc = readFeatureDoc(slug);

  return (
    <FeatureDocPanel>
      <DocsShell title={doc.title} description={doc.description}>
        {doc.sections.map((section) => (
          <DocSection key={section.title} title={section.title}>
            {section.blocks.map((block, index) => {
              if (block.type === "paragraph") {
                return <p key={index}>{renderInlineText(block.content)}</p>;
              }

              if (block.type === "list") {
                return (
                  <ul key={index} className="grid gap-2">
                    {block.items.map((item) => (
                      <li key={item} className="relative pl-4 text-sm leading-6 before:absolute before:left-0 before:top-2.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-gray-300">
                        {renderInlineText(item)}
                      </li>
                    ))}
                  </ul>
                );
              }

              return <CodeBlock key={index}>{block.content}</CodeBlock>;
            })}
          </DocSection>
        ))}
      </DocsShell>
    </FeatureDocPanel>
  );
};
