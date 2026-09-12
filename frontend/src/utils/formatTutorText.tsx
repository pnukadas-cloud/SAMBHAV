import React from "react";
import katex from "katex";

/**
 * Helper to render inline LaTeX math cleanly using KaTeX.
 */
function InlineMath({ math }: { math: string }) {
  try {
    const html = katex.renderToString(math.trim(), {
      displayMode: false,
      throwOnError: false,
    });
    return <span className="katex-inline" dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <span className="katex-fallback">${math}$</span>;
  }
}

/**
 * Helper to render display/block LaTeX math cleanly using KaTeX.
 */
function BlockMath({ math }: { math: string }) {
  try {
    const html = katex.renderToString(math.trim(), {
      displayMode: true,
      throwOnError: false,
    });
    return <div className="katex-display-block" dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <div className="katex-fallback">$${math}$$</div>;
  }
}

/**
 * Parses inline formatting like LaTeX math ($...$), **bold**, *italic*, and `code`.
 */
function parseInlineFormatting(str: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Regex matches:
  // 1. Block math: \$\$([\s\S]*?)\$\$
  // 2. Inline math: \$([^\$\n]+?)\$
  // 3. Bold: \*\*([^*]+?)\*\*
  // 4. Italic: \*([^*]+?)\*
  // 5. Code: `([^`]+?)`
  const regex = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$|\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];
    const key = `token-${match.index}-${lastIndex}`;

    if (token.startsWith("$$") && token.endsWith("$$")) {
      const math = token.slice(2, -2);
      parts.push(<BlockMath key={key} math={math} />);
    } else if (token.startsWith("$") && token.endsWith("$") && token.length > 2) {
      const math = token.slice(1, -1);
      parts.push(<InlineMath key={key} math={math} />);
    } else if (token.startsWith("**") && token.endsWith("**")) {
      const inner = token.slice(2, -2);
      parts.push(<strong key={key}>{parseInlineFormatting(inner)}</strong>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      const inner = token.slice(1, -1);
      parts.push(<em key={key}>{inner}</em>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      const inner = token.slice(1, -1);
      parts.push(<code key={key} className="inline-code-badge">{inner}</code>);
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

/**
 * Parses and formats AI tutor responses into clean, elegant HTML with LaTeX math rendering.
 */
export function formatTutorText(text: string): React.ReactNode {
  if (!text) return null;

  // Split text into paragraphs separated by double newlines
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="formatted-tutor-content">
      {paragraphs.map((para, pIdx) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        // Check if paragraph is purely a display block math ($$...$$)
        if (trimmed.startsWith("$$") && trimmed.endsWith("$$")) {
          const math = trimmed.slice(2, -2);
          return <BlockMath key={pIdx} math={math} />;
        }

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

        // Check if individual lines inside paragraph have display equations or bullet lists
        return (
          <p key={pIdx} className="tutor-para">
            {lines.map((line, lIdx) => {
              const lineTrimmed = line.trim();
              if (lineTrimmed.startsWith("$$") && lineTrimmed.endsWith("$$")) {
                const math = lineTrimmed.slice(2, -2);
                return <BlockMath key={lIdx} math={math} />;
              }
              return (
                <React.Fragment key={lIdx}>
                  {parseInlineFormatting(line)}
                  {lIdx < lines.length - 1 && <br />}
                </React.Fragment>
              );
            })}
          </p>
        );
      })}
    </div>
  );
}
