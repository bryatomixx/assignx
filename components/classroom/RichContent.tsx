import React from "react";

/**
 * RichContent renders a lesson's plain-text `content` while turning links into
 * real anchors. It supports two link forms:
 *   - markdown:  [label](https://example.com)
 *   - bare URL:  https://example.com
 *
 * Newlines are preserved by the PARENT, which must keep `whitespace-pre-line`.
 * We only emit a flat list of strings + <a> nodes, so the pre-line CSS still
 * collapses/keeps whitespace exactly as before.
 */

// One token = a markdown link OR a bare URL. Capture groups:
//   1 = md label, 2 = md url, 3 = bare url
const TOKEN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g;

const linkClass =
  "font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 break-words";

export function RichContent({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  // matchAll iterates without us touching the shared regex's lastIndex.
  for (const match of text.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }
    const href = match[2] ?? match[3];
    const label = match[1] ?? match[3];
    nodes.push(
      <a
        key={key++}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {label}
      </a>,
    );
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <>{nodes}</>;
}
