// A movement's tags as names. The server sends them as objects ({ _id, name, color }, as the web reads them); a plain
// string is taken as it is.
export function tagNames(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => (typeof tag === 'string' ? tag : tag && typeof tag === 'object' && 'name' in tag ? String((tag as { name?: unknown }).name ?? '') : ''))
    .map((name) => name.trim())
    .filter(Boolean);
}
