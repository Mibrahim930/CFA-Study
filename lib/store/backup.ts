// Backup and restore of everything the app keeps in this browser (all localStorage keys under "l1:").
// Until Supabase sync exists, this is how progress survives a cleared browser or moves to another device.

export const BACKUP_PREFIX = "l1:";
/** When the last backup file was downloaded (ms since epoch). Not itself exported. */
export const LAST_BACKUP_KEY = "l1:meta:lastBackup";

export interface BackupFile {
  app: "l1-study";
  version: 1;
  exportedAt: string;
  entries: Record<string, string>;
}

export function buildBackup(entries: Record<string, string>, now: Date): BackupFile {
  const kept = Object.fromEntries(Object.entries(entries).filter(([k]) => k.startsWith(BACKUP_PREFIX) && k !== LAST_BACKUP_KEY));
  return { app: "l1-study", version: 1, exportedAt: now.toISOString(), entries: kept };
}

/** Validate a file the user picked. Throws a message written for the user. */
export function parseBackup(text: string): BackupFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("That file isn't a backup from this app (it isn't valid JSON).");
  }
  const d = data as Partial<BackupFile>;
  if (d?.app !== "l1-study" || typeof d.entries !== "object" || d.entries === null) {
    throw new Error("That file isn't a backup from this app.");
  }
  if (d.version !== 1) throw new Error(`This backup is version ${String(d.version)}; this app reads version 1. Update the app and try again.`);
  for (const [k, v] of Object.entries(d.entries)) {
    if (!k.startsWith(BACKUP_PREFIX) || typeof v !== "string") throw new Error(`The backup has an unexpected entry ("${k}"), so it wasn't restored.`);
  }
  return d as BackupFile;
}

/** Plain-language summary of what a backup holds. */
export function describeBackup(b: BackupFile): { modules: number; cards: number; notes: number } {
  let modules = 0;
  let notes = 0;
  let cards = 0;
  for (const [k, v] of Object.entries(b.entries)) {
    try {
      if (k.startsWith("l1:module:")) {
        const m = JSON.parse(v) as { done?: boolean; notes?: unknown[] };
        if (m.done) modules++;
        notes += m.notes?.length ?? 0;
      } else if (k === "l1:review") {
        cards += Object.keys(JSON.parse(v) as object).length;
      }
    } catch {
      // a damaged entry still restores as-is; it just isn't counted
    }
  }
  return { modules, cards, notes };
}

/** Days since the last download, or null if never. */
export function daysSinceBackup(last: number | null, now: number): number | null {
  return last === null ? null : Math.floor((now - last) / 86_400_000);
}
