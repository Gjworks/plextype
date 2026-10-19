export const cleanText = (text: string) =>
  text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const extractTiptapText = (nodes: any[]): string => {
  return nodes
    .map((node) => {
      if (node.type === "text" && node.text) return node.text;
      if (Array.isArray(node.content)) return extractTiptapText(node.content);
      return "";
    })
    .filter(Boolean)
    .join(" ");
};

export const toPreview = (content?: string | null) => {
  if (!content) return "";

  try {
    let parsed = JSON.parse(content);
    if (typeof parsed === "string") parsed = JSON.parse(parsed);

    if (parsed?.type === "doc" && Array.isArray(parsed.content)) {
      const text = cleanText(extractTiptapText(parsed.content));
      return text.length > 90 ? `${text.slice(0, 90).trim()}...` : text;
    }

    if (Array.isArray(parsed?.blocks)) {
      const text = cleanText(
        parsed.blocks
          .map((block: any) => block?.data?.text || block?.data?.caption || "")
          .join(" "),
      );
      return text.length > 90 ? `${text.slice(0, 90).trim()}...` : text;
    }
  } catch {
    const text = cleanText(content);
    return text.length > 90 ? `${text.slice(0, 90).trim()}...` : text;
  }

  return "";
};
