import DOMPurify from "isomorphic-dompurify";

// Shared by persistence and rendering, including records saved before this policy.
export function sanitizeHtml(value: string | null | undefined): string {
  return DOMPurify.sanitize(value || "", {
    ALLOWED_TAGS: ["p", "br", "div", "span", "strong", "b", "em", "i", "u", "s", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "pre", "code", "a", "img", "table", "thead", "tbody", "tr", "th", "td", "hr", "figure", "figcaption"],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "width", "height", "colspan", "rowspan", "class"],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
}
