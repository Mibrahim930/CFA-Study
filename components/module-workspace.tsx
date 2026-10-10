"use client";

import { useRef, useState } from "react";
import type { Los } from "@/lib/syllabus/types";
import { newId, useModuleState } from "@/lib/store/local";
import { formatTime, parseYouTubeId } from "@/lib/youtube";
import { YouTubePlayer, type PlayerHandle } from "./youtube-player";

const RATES = [1, 1.25, 1.5, 1.75, 2];

export function ModuleWorkspace({ slug, los }: { slug: string; los: Los[] }) {
  const [state, update] = useModuleState(slug);
  const player = useRef<PlayerHandle>(null);
  const [active, setActive] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [draft, setDraft] = useState("");
  const [stamp, setStamp] = useState(true);
  const [rate, setRate] = useState(1.25);

  const videoId = active ?? state.lastVideo?.id ?? state.videos[0] ?? null;
  const resumeAt = state.lastVideo?.id === videoId ? state.lastVideo.t : 0;

  function addVideo(e: React.FormEvent) {
    e.preventDefault();
    const id = parseYouTubeId(url);
    if (!id) return setUrlError("That doesn't look like a YouTube video link.");
    setUrlError("");
    setUrl("");
    update((s) => (s.videos.includes(id) ? s : { ...s, videos: [...s.videos, id] }));
    setActive(id);
  }

  function addNote(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const t = stamp && videoId ? player.current?.currentTime() : undefined;
    update((s) => ({
      ...s,
      notes: [...s.notes, { id: newId(), text, videoId: t !== undefined ? videoId! : undefined, t, createdAt: Date.now() }],
    }));
    setDraft("");
  }

  function jumpTo(id: string, t: number) {
    if (id !== videoId) {
      update((s) => ({ ...s, lastVideo: { id, t } }));
      setActive(id);
    } else player.current?.seek(t);
  }

  const losDone = new Set(state.losDone);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="space-y-4">
        {videoId ? (
          <>
            <YouTubePlayer
              key={videoId}
              ref={player}
              videoId={videoId}
              start={resumeAt}
              rate={rate}
              onProgress={(t) => update((s) => ({ ...s, lastVideo: { id: videoId, t } }))}
            />
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted">Speed</span>
              {RATES.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRate(r);
                    player.current?.setRate(r);
                  }}
                  className={`rounded-md px-2 py-1 ${r === rate ? "bg-accent text-accent-fg" : "bg-surface-2 hover:bg-surface-3"}`}
                >
                  {r}×
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">
            Add a lecture video for this module below. Free picks: Let Me Explain, AnalystPrep, IFT.
          </div>
        )}

        {state.videos.length > 0 && (
          <ul className="flex flex-wrap gap-2 text-sm">
            {state.videos.map((id, i) => (
              <li key={id} className="flex items-center overflow-hidden rounded-md bg-surface-2">
                <button
                  onClick={() => setActive(id)}
                  className={`px-3 py-1 ${id === videoId ? "font-semibold text-accent" : ""}`}
                >
                  Video {i + 1}
                </button>
                <button
                  aria-label={`Remove video ${i + 1}`}
                  onClick={() => {
                    update((s) => ({ ...s, videos: s.videos.filter((v) => v !== id) }));
                    if (active === id) setActive(null);
                  }}
                  className="px-2 py-1 text-muted hover:text-danger"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addVideo} className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a YouTube video link"
            className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm"
          />
          <button className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg">Add</button>
        </form>
        {urlError && <p className="text-sm text-danger">{urlError}</p>}

        <div className="rounded-lg border border-line p-4">
          <h2 className="mb-3 font-semibold">My notes</h2>
          <form onSubmit={addNote} className="space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote(e);
              }}
              rows={3}
              placeholder="Write what you just learned, in your own words…"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
            />
            <div className="flex items-center justify-between gap-2 text-sm">
              <label className="flex items-center gap-2 text-muted">
                <input type="checkbox" checked={stamp} onChange={(e) => setStamp(e.target.checked)} />
                Attach video timestamp
              </label>
              <button className="rounded-md bg-accent px-3 py-1.5 font-medium text-accent-fg">Save note</button>
            </div>
          </form>
          <ul className="mt-4 space-y-3">
            {[...state.notes].reverse().map((n) => (
              <li key={n.id} className="group rounded-md bg-surface-2 p-3 text-sm">
                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted">
                  {n.videoId && n.t !== undefined ? (
                    <button onClick={() => jumpTo(n.videoId!, n.t!)} className="font-mono text-accent hover:underline">
                      ▶ {formatTime(n.t)}
                      {state.videos.indexOf(n.videoId) >= 0 && ` · video ${state.videos.indexOf(n.videoId) + 1}`}
                    </button>
                  ) : (
                    <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                  )}
                  <button
                    aria-label="Delete note"
                    onClick={() => update((s) => ({ ...s, notes: s.notes.filter((x) => x.id !== n.id) }))}
                    className="opacity-60 hover:text-danger group-hover:opacity-100"
                  >
                    Delete
                  </button>
                </div>
                <p className="whitespace-pre-wrap">{n.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-lg border border-line p-4">
          <h2 className="mb-1 font-semibold">Learning outcomes</h2>
          <p className="mb-3 text-xs text-muted">
            Tick each one when you can explain it without looking. {losDone.size}/{los.length}
          </p>
          <ul className="space-y-2">
            {los.map((l) => (
              <li key={l.id}>
                <label className="flex gap-2 text-sm leading-snug">
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={losDone.has(l.id)}
                    onChange={(e) =>
                      update((s) => ({
                        ...s,
                        losDone: e.target.checked ? [...s.losDone, l.id] : s.losDone.filter((x) => x !== l.id),
                      }))
                    }
                  />
                  <span className={losDone.has(l.id) ? "text-muted line-through" : ""}>{l.text}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => update((s) => ({ ...s, done: !s.done }))}
          className={`w-full rounded-md px-3 py-2 text-sm font-medium ${
            state.done ? "bg-success text-white" : "border border-line hover:bg-surface-2"
          }`}
        >
          {state.done ? "✓ Module complete" : "Mark module complete"}
        </button>
      </aside>
    </div>
  );
}
