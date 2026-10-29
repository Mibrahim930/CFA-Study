"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import { BACKUP_PREFIX, buildBackup, describeBackup, LAST_BACKUP_KEY, LOCAL_ONLY_PREFIX, parseBackup, type BackupFile } from "@/lib/store/backup";
import { notifyStores, persistSet } from "@/lib/store/persist";

function storedEntries(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(BACKUP_PREFIX)) out[k] = localStorage.getItem(k) ?? "";
    }
  } catch {
    // storage unavailable
  }
  return out;
}

/** Last backup time: a number, null if never, undefined while prerendering. */
export function useLastBackup(): number | null | undefined {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      window.addEventListener("l1-backup-change", cb);
      return () => {
        window.removeEventListener("storage", cb);
        window.removeEventListener("l1-backup-change", cb);
      };
    },
    () => {
      try {
        const v = localStorage.getItem(LAST_BACKUP_KEY);
        return v ? Number(v) : null;
      } catch {
        return null;
      }
    },
    () => undefined,
  );
}

/** Summary of what's on this device, re-read whenever any store changes (undefined while prerendering). */
function useDeviceSummary(): string | undefined {
  return useSyncExternalStore(
    (cb) => {
      const events = ["storage", "l1-store-change", "l1-review-change", "l1-backup-change"];
      for (const e of events) window.addEventListener(e, cb);
      return () => {
        for (const e of events) window.removeEventListener(e, cb);
      };
    },
    () => JSON.stringify(describeBackup(buildBackup(storedEntries(), new Date(0)))),
    () => undefined,
  );
}

const fmtDate = (ms: number) => new Date(ms).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function BackupPanel() {
  const router = useRouter();
  const last = useLastBackup();
  const summaryRaw = useDeviceSummary();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [error, setError] = useState("");

  const download = () => {
    const now = new Date();
    const backup = buildBackup(storedEntries(), now);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `l1-study-backup-${now.toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    try {
      localStorage.setItem(LAST_BACKUP_KEY, String(now.getTime()));
    } catch {
      // storage unavailable
    }
    window.dispatchEvent(new Event("l1-backup-change"));
  };

  const pick = async (file: File | undefined) => {
    setError("");
    setPending(null);
    if (!file) return;
    try {
      setPending(parseBackup(await file.text()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "That file couldn't be read.");
    }
    if (fileInput.current) fileInput.current.value = "";
  };

  const restore = (b: BackupFile) => {
    // Written through persistSet so a signed-in account receives the restored progress too.
    let ok = true;
    for (const k of Object.keys(storedEntries())) if (!k.startsWith(LOCAL_ONLY_PREFIX)) ok = persistSet(k, null) && ok;
    for (const [k, v] of Object.entries(b.entries)) if (!k.startsWith(LOCAL_ONLY_PREFIX)) ok = persistSet(k, v) && ok;
    if (!ok) {
      setError("This browser wouldn't let the app save data (private mode or storage full), so the restore didn't finish. Try again in a normal window.");
      return;
    }
    // Stores re-read storage on every read; these events make mounted views re-render with the restored data.
    notifyStores(Object.keys(b.entries));
    router.push("/");
  };

  const device = summaryRaw ? (JSON.parse(summaryRaw) as ReturnType<typeof describeBackup>) : null;
  const incoming = pending && describeBackup(pending);

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-tile border border-line bg-surface p-6">
        <h2 className="text-lg font-bold">Download a backup</h2>
        <p className="text-muted">
          Saves everything on this device
          {device && ` (${plural(device.modules, "finished module")}, ${plural(device.cards, "review card")}, ${plural(device.notes, "note")})`} to a file. Keep it
          somewhere safe, like your cloud drive.
        </p>
        {last !== undefined && <p className="text-sm text-muted">{last === null ? "You haven't backed up on this device yet." : `Last backup: ${fmtDate(last)}.`}</p>}
        <button type="button" onClick={download} className="min-h-11 rounded-control bg-accent px-5 font-bold text-accent-fg">
          Download backup
        </button>
      </section>

      <section className="space-y-3 rounded-tile border border-line bg-surface p-6">
        <h2 className="text-lg font-bold">Restore from a backup</h2>
        <p className="text-muted">Use this on a new device, or after clearing your browser. It replaces the progress on this device with the backup&apos;s.</p>
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-control border border-control-line px-5 font-semibold hover:border-accent focus-within:outline-2 focus-within:outline-accent">
          Choose backup file…
          <input ref={fileInput} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        {error && (
          <p role="alert" className="rounded-control border-l-4 border-danger bg-danger/8 p-3 text-sm">
            {error}
          </p>
        )}
        {pending && incoming && (
          <div role="alertdialog" aria-labelledby="restore-title" aria-describedby="restore-detail" className="space-y-3 rounded-control border-2 border-accent bg-accent-soft p-4">
            <p id="restore-title" className="font-bold">
              Replace this device&apos;s progress?
            </p>
            <p id="restore-detail" className="text-sm">
              The backup from {fmtDate(Date.parse(pending.exportedAt))} has {plural(incoming.modules, "finished module")}, {plural(incoming.cards, "review card")} and{" "}
              {plural(incoming.notes, "note")}.
              {device && ` This device's ${plural(device.modules, "finished module")} and ${plural(device.cards, "review card")} will be replaced.`} Download a backup
              first if you might want them.
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <button type="button" autoFocus onClick={() => setPending(null)} className="min-h-11 rounded-control border border-control-line bg-surface px-4 font-semibold hover:border-accent">
                Cancel
              </button>
              <button type="button" onClick={() => restore(pending)} className="min-h-11 rounded-control bg-accent px-5 font-bold text-accent-fg">
                Replace and restore
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
