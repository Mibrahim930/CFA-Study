/**
 * Video map: Let Me Explain playlists → syllabus modules (milestone M1).
 *   npx tsx content-pipeline/video-map.ts
 * Uses the official YouTube Data API for METADATA ONLY (titles, positions, durations) — no scraping, no
 * transcripts (YouTube ToS; see docs/PLAN.md §2d). Videos play through the official embedded player.
 * Writes content/video-map.json.
 */
import { writeFileSync } from "node:fs";
import { Bm25Index } from "../lib/kb/search";
import type { SourceChunk } from "../lib/kb/types";
import { losForTopic } from "./lib/context";

/** Let Me Explain (channel UCU8yrE7yj2kAMo_Paher-3g) Level I playlists, newest edition per topic. */
const PLAYLISTS: { topic: string; id: string; label: string }[] = [
  { topic: "quant", id: "PLzsMtRJ44d8zHdW1Q8PyPUjvfNlRwmf_Q", label: "CFA Level 1 2027 - Quantitative Methods" },
  { topic: "equity", id: "PLzsMtRJ44d8xNfH-zAKseZeAPHZKuItM5", label: "CFA Level 1 2027 - Equities" },
  { topic: "econ", id: "PLzsMtRJ44d8w5RexziVw_Tcc1LgFcQhIV", label: "CFA Level 1 2026 / 2027 - Economics" },
  { topic: "corpfin", id: "PLzsMtRJ44d8woDvGaRLnyOsLgxCcTdA43", label: "CFA Level 1 2026 / 2027 - Corporate Issuers" },
  { topic: "fsa", id: "PLzsMtRJ44d8zOuFR2LBpNrfPMdBDBm1Ui", label: "CFA Level 1 2026 / 2027 - Financial Statements Analysis" },
  { topic: "fsa", id: "PLzsMtRJ44d8xpqKLcXDYPtXEJwDs2SqYD", label: "CFA Level 1 - Deferred Tax" },
  { topic: "fixed-income", id: "PLzsMtRJ44d8zpAKwsrqu_JgGpfteef9mZ", label: "CFA Level 1 2026 / 2027 - Fixed Income" },
  { topic: "derivatives", id: "PLzsMtRJ44d8xCXMyxogys-pBqk5i9T2mf", label: "CFA Level 1 2026 / 2027 - Derivatives" },
  { topic: "alternatives", id: "PLzsMtRJ44d8zH8riYFWHpUOdgbw-cVeLn", label: "CFA Level 1 2026 / 2027 - Alternative Investments" },
  { topic: "portfolio", id: "PLzsMtRJ44d8wNTxkhQGsLYWm8J7MG0sGl", label: "CFA Level 1 2026 / 2027 - Portfolio Management" },
  { topic: "ethics", id: "PLzsMtRJ44d8y709vyuIvubeJRnlls8jpu", label: "CFA Level 1 2026 - Ethics" },
];

export interface MappedVideo {
  videoId: string;
  title: string;
  seconds: number;
  playlist: string;
  position: number;
}

process.loadEnvFile(".env.local");
const KEY = process.env.YOUTUBE_API_KEY;
if (!KEY) throw new Error("YOUTUBE_API_KEY is missing in .env.local");

async function api<T>(path: string, params: Record<string, string>): Promise<T> {
  const u = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [k, v] of Object.entries({ ...params, key: KEY! })) u.searchParams.set(k, v);
  const r = await fetch(u);
  const j = (await r.json()) as T & { error?: { message?: string } };
  if (!r.ok) throw new Error(`${path}: ${r.status} ${j.error?.message ?? ""}`);
  return j;
}

/** ISO 8601 duration (PT1H2M3S) → seconds. */
export function isoSeconds(d: string): number {
  const m = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
}

async function playlistVideos(id: string, label: string): Promise<MappedVideo[]> {
  const items: { videoId: string; title: string; position: number }[] = [];
  let pageToken = "";
  do {
    type Page = { items: { snippet: { title: string; position: number; resourceId: { videoId: string } } }[]; nextPageToken?: string };
    const page = await api<Page>("playlistItems", { part: "snippet", playlistId: id, maxResults: "50", ...(pageToken ? { pageToken } : {}) });
    for (const it of page.items) {
      if (/^(private|deleted) video$/i.test(it.snippet.title)) continue;
      items.push({ videoId: it.snippet.resourceId.videoId, title: it.snippet.title, position: it.snippet.position });
    }
    pageToken = page.nextPageToken ?? "";
  } while (pageToken);

  const seconds = new Map<string, number>();
  for (let i = 0; i < items.length; i += 50) {
    type Vids = { items: { id: string; contentDetails: { duration: string } }[] };
    const v = await api<Vids>("videos", { part: "contentDetails", id: items.slice(i, i + 50).map((x) => x.videoId).join(",") });
    for (const it of v.items) seconds.set(it.id, isoSeconds(it.contentDetails.duration));
  }
  return items.map((x) => ({ ...x, seconds: seconds.get(x.videoId) ?? 0, playlist: label }));
}

async function main() {
  const modules: Record<string, MappedVideo[]> = {};
  const unassigned: MappedVideo[] = [];
  for (const pl of PLAYLISTS) {
    const videos = await playlistVideos(pl.id, pl.label);
    // One "document" per module: its title (weighted) plus its LOS text, searched with each video title.
    const mods = [...new Map(losForTopic(pl.topic).map((c) => [c.module.id, c.module])).values()];
    const docs: SourceChunk[] = mods.map((m) => ({
      id: m.id, source: "other", tier: "T3", title: m.title, locator: m.title, url: "", license: "", reuse: "ground",
      text: `${m.title} ${m.title} ${m.title} ${m.los.map((l) => l.text).join(" ")}`,
    }));
    const index = new Bm25Index(docs);
    // Playlists follow curriculum order, so a title with no keyword match goes with the video before it.
    let previous: string | undefined;
    for (const v of [...videos].sort((a, b) => a.position - b.position)) {
      const best = index.search(v.title.replace(/CFA|Level ?(1|I)|20\d\d|\(.*?\)|part \d+|#\d+/gi, " "), 1)[0];
      const moduleId = best?.chunk.id ?? previous;
      if (moduleId) {
        (modules[moduleId] ??= []).push(v);
        previous = moduleId;
      } else unassigned.push(v);
    }
    console.log(`${pl.label}: ${videos.length} videos`);
  }
  for (const list of Object.values(modules)) list.sort((a, b) => a.playlist.localeCompare(b.playlist) || a.position - b.position);
  const assigned = Object.values(modules).reduce((n, l) => n + l.length, 0);
  writeFileSync(
    "content/video-map.json",
    JSON.stringify({ generatedAt: new Date().toISOString(), channel: "Let me explain (UCU8yrE7yj2kAMo_Paher-3g)", playlists: PLAYLISTS, modules, unassigned }, null, 2) + "\n",
  );
  console.log(`assigned ${assigned}, unassigned ${unassigned.length}; modules with videos: ${Object.keys(modules).length}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
