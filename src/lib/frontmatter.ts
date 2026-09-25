/** Minimal `---` frontmatter + paragraphs parser for the content folders. */
export function parseFrontmatter(markdown: string) {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const meta: Record<string, string> = {};
  for (const line of (match?.[1] ?? "").split("\n")) {
    const [key, ...rest] = line.split(":");
    if (key?.trim() && rest.length) meta[key.trim()] = rest.join(":").trim();
  }
  const body = (match ? match[2] : markdown).trim();
  return { meta, paragraphs: body ? body.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()) : [] };
}
