/**
 * Minimal CNXML (OpenStax source format) → plain text. Good enough for grounding/retrieval;
 * MathML is flattened to its token text (e.g. "PV = FV / ( 1 + r ) n").
 */

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#160;": " ",
  "&nbsp;": " ",
};

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&[a-z]+;|&#160;/gi, (e) => ENTITIES[e] ?? e);
}

function flattenMath(xml: string): string {
  return xml.replace(/<m:math[\s\S]*?<\/m:math>/g, (m) => {
    const tokens = [...m.matchAll(/<m:(?:mi|mn|mo|mtext)[^>]*>([\s\S]*?)<\/m:(?:mi|mn|mo|mtext)>/g)].map((x) =>
      decodeEntities(x[1]).trim(),
    );
    return ` ${tokens.join(" ")} `;
  });
}

export function cnxmlToText(xml: string): string {
  return decodeEntities(
    flattenMath(xml.replace(/\r\n?/g, "\n"))
      .replace(/<(?:para|title|item|caption|term|row|entry|equation|note|example|exercise)\b[^>]*>/g, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export interface CnxmlSection {
  title: string;
  text: string;
}

/** Split a module's <content> into top-level sections (text before the first section becomes "Overview"). */
export function splitModule(rawXml: string): { title: string; sections: CnxmlSection[] } {
  const xml = rawXml.replace(/\r\n?/g, "\n"); // Windows checkouts may have CRLF line endings
  const title = decodeEntities(xml.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "").trim();
  const content = xml.match(/<content>([\s\S]*)<\/content>/)?.[1] ?? "";
  const sections: CnxmlSection[] = [];

  // Walk top-level <section> elements by tracking nesting depth.
  const re = /<section\b[^>]*>|<\/section>/g;
  let depth = 0;
  let start = -1;
  let lastEnd = 0;
  let intro = "";
  for (let m = re.exec(content); m; m = re.exec(content)) {
    if (m[0].startsWith("<section")) {
      if (depth === 0) {
        intro += content.slice(lastEnd, m.index);
        start = m.index;
      }
      depth++;
    } else {
      depth--;
      if (depth === 0 && start >= 0) {
        const body = content.slice(start, m.index + m[0].length);
        if (!/class="(?:learning-objectives|key-terms|summary|review-questions|problems|video-activity|link-to-learning)"/.test(body.slice(0, 200))) {
          const secTitle = decodeEntities(body.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "").trim();
          sections.push({ title: secTitle || title, text: cnxmlToText(body) });
        }
        lastEnd = m.index + m[0].length;
      }
    }
  }
  intro += content.slice(lastEnd);
  const introText = cnxmlToText(intro);
  if (introText.length > 80) sections.unshift({ title: "Overview", text: introText });
  return { title, sections };
}
