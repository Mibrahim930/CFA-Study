/**
 * Dependency-free HTML -> readable text, for the ingest pipeline (static government/central-bank pages).
 * Callers: content-pipeline/ingest-sources.ts (kind: "html" entries). Input: an HTML string. Output: plain text with
 * one logical line per block element ("- " bullets for list items), and no scripts, styles, navigation or footers.
 * Not a general parser: it targets server-rendered article pages and fails safe (drops boilerplate, keeps text).
 */

const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", lsquo: "‘", rsquo: "’",
  ldquo: "“", rdquo: "”", bull: "•", middot: "·", copy: "©", reg: "®", trade: "™", deg: "°", euro: "€", pound: "£", yen: "¥",
  cent: "¢", times: "×", divide: "÷", plusmn: "±", frac12: "½", frac14: "¼", frac34: "¾", sect: "§", para: "¶", laquo: "«", raquo: "»",
  eacute: "é", egrave: "è", agrave: "à", ccedil: "ç", uuml: "ü", ouml: "ö", auml: "ä", szlig: "ß", ntilde: "ñ", shy: "",
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return m;
      return String.fromCodePoint(code === 0xa0 ? 0x20 : code);
    }
    return NAMED[e.toLowerCase()] ?? m;
  });
}

const DROP_BLOCKS = ["script", "style", "noscript", "template", "svg", "nav", "header", "footer", "aside", "form", "iframe", "select", "button"];
const BLOCK_TAGS =
  "p|div|section|article|main|br|hr|li|ul|ol|dl|dt|dd|tr|table|thead|tbody|h[1-6]|blockquote|pre|figure|figcaption|caption|details|summary";

/** Page <title> (decoded, trimmed), or "" when absent. */
export function htmlTitle(html: string): string {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return m ? decodeEntities(m[1].replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim() : "";
}

/** Narrow to <main> or <article> when the page has one; otherwise keep the whole body. */
function mainRegion(html: string): string {
  for (const tag of ["main", "article"]) {
    const m = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*)</${tag}>`, "i").exec(html);
    if (m && m[1].replace(/<[^>]*>/g, "").trim().length > 300) return m[1];
  }
  const body = /<body\b[^>]*>([\s\S]*)<\/body>/i.exec(html);
  return body ? body[1] : html;
}

/**
 * Site menus and "related pages" lists survive tag stripping as long runs of short lines with no sentence
 * punctuation. Drop any run of MENU_RUN or more such lines. Table rows (" | ") and real sentences are kept.
 */
const MENU_RUN = 6;
const MENU_LINE_MAX = 48;
const isMenuLine = (l: string) => l.length <= MENU_LINE_MAX && !/\d/.test(l) && !l.includes(" | ") && !/[.!;,:]$/.test(l);

function dropMenuRuns(lines: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < lines.length; ) {
    let j = i;
    while (j < lines.length && isMenuLine(lines[j])) j++;
    if (j - i >= MENU_RUN) i = j;
    else {
      out.push(lines[i]);
      i++;
    }
  }
  return out;
}

export function htmlToText(html: string): string {
  let s = html.replace(/<!--[\s\S]*?-->/g, "");
  s = mainRegion(s);
  for (const tag of DROP_BLOCKS) s = s.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}>`, "gi"), "\n");
  s = s.replace(/<li\b[^>]*>/gi, "\n- ");
  s = s.replace(/<\/(td|th)>/gi, " | ");
  s = s.replace(new RegExp(`</?(?:${BLOCK_TAGS})\\b[^>]*>`, "gi"), "\n");
  s = s.replace(/<[^>]*>/g, "");
  s = decodeEntities(s);
  const lines = s
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/[ \t ]+/g, " ").replace(/(?: \| )+$/, "").trim())
    .filter((l) => l && l !== "-" && l !== "|");
  return dropMenuRuns(lines).join("\n");
}
