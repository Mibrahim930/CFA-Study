import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cacheLife } from "next/cache";

/** Let Me Explain lectures mapped to modules by content-pipeline/video-map.ts (metadata only). */
export interface Lecture {
  videoId: string;
  title: string;
  seconds: number;
}

export async function getModuleLectures(moduleId: string): Promise<Lecture[]> {
  "use cache";
  cacheLife("max");
  const file = join(process.cwd(), "content", "video-map.json");
  if (!existsSync(file)) return [];
  const map = JSON.parse(readFileSync(file, "utf8")) as { modules: Record<string, (Lecture & { position: number })[]> };
  return (map.modules[moduleId] ?? []).map(({ videoId, title, seconds }) => ({
    videoId,
    // Titles end with "(for the CFA Level 1 exam)"; the module page already says which exam.
    title: title.replace(/\s*\(for the @?CFA Level 1 exam\)\s*$/i, "").trim(),
    seconds,
  }));
}
