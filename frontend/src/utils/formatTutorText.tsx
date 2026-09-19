import React from "react";
import katex from "katex";

/**
 * Helper to render inline LaTeX math cleanly using KaTeX.
 */
function InlineMath({ math }: { math: string }) {
  try {
    const cleanMath = math.trim();
    const html = katex.renderToString(cleanMath, {
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
    const cleanMath = math.trim();
    const html = katex.renderToString(cleanMath, {
      displayMode: true,
      throwOnError: false,
    });
    return <div className="katex-display-block" dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <div className="katex-fallback">$${math}$$</div>;
  }
}

/**
 * Parses inline formatting like LaTeX math ($...$, \(...\)), **bold**, *italic*, and `code`.
 */
function parseInlineFormatting(str: string): React.ReactNode {
  if (!str) return null;
  const parts: React.ReactNode[] = [];
  
  // Regex matches:
  // 1. Display math: \$\$([\s\S]*?)\$\$ or \\\[([\s\S]*?)\\\]
  // 2. Inline math: \$([^\$\n]+?)\$ or \\\(([^\(\)\n]+?)\\\)
  // 3. Bold: \*\*([^*]+?)\*\*
  // 4. Italic: \*([^*]+?)\*
  // 5. Code: `([^`]+?)`
  const regex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^\$\n]+?\$|\\\([^\(\)\n]+?\\\)|\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g;
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
    } else if (token.startsWith("\\[") && token.endsWith("\\]")) {
      const math = token.slice(2, -2);
      parts.push(<BlockMath key={key} math={math} />);
    } else if (token.startsWith("$") && token.endsWith("$") && token.length > 2) {
      const math = token.slice(1, -1);
      parts.push(<InlineMath key={key} math={math} />);
    } else if (token.startsWith("\\(") && token.endsWith("\\)") && token.length > 4) {
      const math = token.slice(2, -2);
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
 * Parses and formats AI tutor and Copilot responses into clean, elegant HTML with KaTeX LaTeX math rendering.
 * Supports Markdown headings, bold, bullet lists, numbered lists, block math, code snippets, and normal prose.
 */
export function formatTutorText(text: string): React.ReactNode {
  if (!text) return null;

  // Split text into paragraphs or code blocks
  const rawSections = text.split(/(```[\s\S]*?```|\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g);

  return (
    <div className="formatted-tutor-content">
      {rawSections.map((sec, sIdx) => {
        const trimmed = sec.trim();
        if (!trimmed) return null;

        // Check if section is a display block math ($$...$$ or \[...\])
        if (trimmed.startsWith("$$") && trimmed.endsWith("$$")) {
          const math = trimmed.slice(2, -2);
          return <BlockMath key={sIdx} math={math} />;
        }
        if (trimmed.startsWith("\\[") && trimmed.endsWith("\\]")) {
          const math = trimmed.slice(2, -2);
          return <BlockMath key={sIdx} math={math} />;
        }

        // Check if section is a fenced code block (```lang ... ```)
        if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
          const firstLineBreak = trimmed.indexOf("\n");
          let codeContent = trimmed.slice(3, -3);
          let lang = "";
          if (firstLineBreak !== -1) {
            lang = trimmed.slice(3, firstLineBreak).trim();
            codeContent = trimmed.slice(firstLineBreak + 1, -3);
          }
          return (
            <div key={sIdx} className="tutor-code-block-wrapper">
              {lang && <div className="code-lang-tag">{lang}</div>}
              <pre className="tutor-code-block">
                <code>{codeContent.trim()}</code>
              </pre>
            </div>
          );
        }

        // Regular paragraph block: split by double newlines
        const paragraphs = trimmed.split(/\n\n+/);

        return (
          <React.Fragment key={sIdx}>
            {paragraphs.map((para, pIdx) => {
              const pTrimmed = para.trim();
              if (!pTrimmed) return null;

              // Markdown Headings (### Heading, ## Heading, # Heading)
              if (pTrimmed.startsWith("### ")) {
                return (
                  <h4 key={`${sIdx}-${pIdx}`} className="tutor-heading tutor-h4">
                    {parseInlineFormatting(pTrimmed.replace(/^###\s*/, ""))}
                  </h4>
                );
              }
              if (pTrimmed.startsWith("## ")) {
                return (
                  <h3 key={`${sIdx}-${pIdx}`} className="tutor-heading tutor-h3">
                    {parseInlineFormatting(pTrimmed.replace(/^##\s*/, ""))}
                  </h3>
                );
              }
              if (pTrimmed.startsWith("# ")) {
                return (
                  <h2 key={`${sIdx}-${pIdx}`} className="tutor-heading tutor-h2">
                    {parseInlineFormatting(pTrimmed.replace(/^#\s*/, ""))}
                  </h2>
                );
              }

              // Check if paragraph is composed of bullet points
              const lines = pTrimmed.split(/\n+/);
              const isBulletList =
                lines.length > 1 &&
                lines.every((l) => l.trim().startsWith("•") || l.trim().startsWith("- ") || l.trim().startsWith("* "));
              
              if (isBulletList) {
                return (
                  <ul key={`${sIdx}-${pIdx}`} className="tutor-bullet-list">
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

              // Check if paragraph is composed of numbered list (1. Item, 2. Item)
              const isNumberedList =
                lines.length > 1 &&
                lines.every((l) => /^\d+[\.\)]\s/.test(l.trim()));
              
              if (isNumberedList) {
                return (
                  <ol key={`${sIdx}-${pIdx}`} className="tutor-ordered-list">
                    {lines.map((line, lIdx) => {
                      const cleanLine = line.replace(/^\d+[\.\)]\s*/, "");
                      return (
                        <li key={lIdx} className="tutor-ordered-item">
                          {parseInlineFormatting(cleanLine)}
                        </li>
                      );
                    })}
                  </ol>
                );
              }

              // Check if single line is bullet or numbered item
              if (lines.length === 1 && (pTrimmed.startsWith("- ") || pTrimmed.startsWith("* ") || pTrimmed.startsWith("• "))) {
                return (
                  <ul key={`${sIdx}-${pIdx}`} className="tutor-bullet-list">
                    <li className="tutor-bullet-item">
                      {parseInlineFormatting(pTrimmed.replace(/^[•\-\*]\s*/, ""))}
                    </li>
                  </ul>
                );
              }

              return (
                <p key={`${sIdx}-${pIdx}`} className="tutor-para">
                  {lines.map((line, lIdx) => {
                    const lineTrimmed = line.trim();
                    if (lineTrimmed.startsWith("$$") && lineTrimmed.endsWith("$$")) {
                      const math = lineTrimmed.slice(2, -2);
                      return <BlockMath key={lIdx} math={math} />;
                    }
                    if (lineTrimmed.startsWith("\\[") && lineTrimmed.endsWith("\\]")) {
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
          </React.Fragment>
        );
      })}
    </div>
  );
}
