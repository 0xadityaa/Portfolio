/**
 * Calculate reading time from the prose a reader actually reads.
 * Strips code blocks, image lines, HTML tags, table rows, link URLs and bare
 * URLs, then counts words at 230 wpm and rounds up.
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 230;
  const text = content
    .replace(/^---[\s\S]*?\n---\n/, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^!\[.*$/gm, "")
    .replace(/<[^>]+>/g, "")
    .replace(/^\|.*$/gm, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "");
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Format reading time as "X min read"
 */
export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`;
}
