import katex from "katex";

// Minimal markdown + KaTeX for generated lesson text: paragraphs, "- " and "1. " lists, **bold**,
// *italic*, `code`, inline $…$ and display $$…$$. Text is HTML-escaped before formatting is applied,
// and KaTeX renders math with trust disabled, so lesson files cannot inject markup.

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(text: string): string {
  // Split out math first so markdown rules never touch LaTeX.
  return text
    .split(/(\$\$[^$]+\$\$|\$[^$\n]+\$)/g)
    .map((part) => {
      if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) {
        return katex.renderToString(part.slice(2, -2), { displayMode: true, throwOnError: false });
      }
      if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
        return katex.renderToString(part.slice(1, -1), { throwOnError: false });
      }
      return escapeHtml(part)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, "$1<em>$2</em>")
        .replace(/`([^`]+)`/g, '<code class="rounded bg-surface-2 px-1">$1</code>');
    })
    .join("");
}

export function renderRich(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n").filter((l) => l.trim());
      if (lines.length && lines.every((l) => /^\s*[-*]\s+/.test(l))) {
        return `<ul class="list-disc space-y-1 pl-5">${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ""))}</li>`).join("")}</ul>`;
      }
      if (lines.length && lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
        return `<ol class="list-decimal space-y-1 pl-5">${lines.map((l) => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ""))}</li>`).join("")}</ol>`;
      }
      return `<p>${lines.map(inline).join("<br>")}</p>`;
    })
    .join("");
}

export function RichText({ text, className = "" }: { text: string; className?: string }) {
  return <div className={`space-y-3 leading-relaxed ${className}`} dangerouslySetInnerHTML={{ __html: renderRich(text) }} />;
}

export function InlineRich({ text }: { text: string }) {
  return <span dangerouslySetInnerHTML={{ __html: inline(text) }} />;
}
