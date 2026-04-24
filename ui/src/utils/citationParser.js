/**
 * Parses text containing [N] citation markers into segments.
 * @param {string} text
 * @returns {Array<{type: "text", value: string} | {type: "citation", number: number}>}
 */
export function parseCitations(text) {
  const parts = [];
  const regex = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "citation", number: parseInt(match[1], 10) });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts;
}
