import React from "react";

/**
 * Parses and formats AI tutor responses into clean, elegant text.
 * Strips or converts markdown asterisks (**bold**) into clean bold elements,
 * preserves line breaks, paragraphs, and formatted lists cleanly without raw asterisks.
 */
export function formatTutorText(text: string): React.ReactNode {
  if (!text) return null;

  // Split text into paragraphs separated by double newlines or single newlines
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="formatted-tutor-content">
      {paragraphs.map((para, pIdx) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        // Check if paragraph is composed of bullet points
        const lines = trimmed.split(/\n+/);
        if (lines.length > 1 && lines.every((l) => l.trim().startsWith("•") || l.trim().startsWith("-") || l.trim().startsWith("* "))) {
          return (
            <ul key={pIdx} className="tutor-bullet-list">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^[•\-\*]\s*/, "");
                return (
                  <li key={lIdx} className="tutor-bullet-item">
                    {parseInlineFormatting(cleanLine)}
                  </li>
                );
              })}
            </ul>
          );
        }

        return (
          <p key={pIdx} className="tutor-para">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {parseInlineFormatting(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Parses inline formatting like **bold** into <strong> tags without showing raw asterisks.
 */
function parseInlineFormatting(str: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Regex to match **bold** or *italic*
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      const inner = token.slice(2, -2);
      parts.push(<strong key={match.index}>{inner}</strong>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      const inner = token.slice(1, -1);
      parts.push(<em key={match.index}>{inner}</em>);
    } else {
      parts.push(token);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }

  return parts.length > 0 ? parts : str;
}
