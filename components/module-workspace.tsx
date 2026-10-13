"use client";

import { useRef, useState } from "react";
import type { Lecture } from "@/lib/content/videos";
import { SOURCE_GAPS } from "@/lib/syllabus/source-gaps";
import type { Los } from "@/lib/syllabus/types";
import { newId, useModuleState } from "@/lib/store/local";
import { formatTime, parseYouTubeId } from "@/lib/youtube";
import { YouTubePlayer, type PlayerHandle } from "./youtube-player";

const RATES = [1, 1.25, 1.5, 1.75, 2];
const card = "rounded-2xl border border-line bg-surface p-5";
const input = "w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-[0.9375rem] placeholder:text-muted/80";

/** Watch-along area: lecture player, lecture list, your own videos and timestamped notes. */
export function ModuleWorkspace({ slug, lectures = [] }: { slug: string; los?: Los[]; lectures?: Lecture[] }) {
  const [state, update] = useModuleState(slug);
  const player = useRef<PlayerHandle>(null);
  const [active, setActive] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [draft, setDraft] = useState("");
  const [stamp, setStamp] = useState(true);
  const [rate, setRate] = useState(1.25);

  const videoId = active ?? state.lastVideo?.id ?? lectures[0]?.videoId ?? state.videos[0] ?? null;
  const resumeAt = state.lastVideo?.id === videoId ? state.lastVideo.t : 0;
  const titleOf = (id: string) => lectures.find((l) => l.videoId === id)?.title;

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

  return (
    <div className="space-y-5">
      <section aria-labelledby="watch-heading" className={`${card} space-y-4`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="watch-heading" className="text-lg font-bold">
            Watch
          </h2>
          {lectures.length > 0 && (
            <span className="text-sm text-muted">
              {lectures.length} lecture{lectures.length === 1 ? "" : "s"} · {formatTime(lectures.reduce((s, l) => s + l.seconds, 0))} · Let Me Explain
            </span>
          )}
        </div>

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
              <span className="font-semibold text-muted">Speed</span>
              {RATES.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={r === rate}
                  onClick={() => {
                    setRate(r);
                    player.current?.setRate(r);
                  }}
                  className={`min-h-11 rounded-lg px-3 font-semibold ${r === rate ? "bg-accent text-accent-fg" : "bg-surface-2 hover:bg-surface-3"}`}
                >
                  {r}×
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-line p-6 text-center text-muted">
            No lecture is mapped to this module yet. Paste a YouTube link below to add one.
          </div>
        )}

        {lectures.length > 0 && (
          <ol aria-label="Lectures for this module" className="max-h-80 divide-y divide-line overflow-y-auto rounded-xl border border-line">
            {lectures.map((l, i) => (
              <li key={l.videoId}>
                <button
                  type="button"
                  onClick={() => setActive(l.videoId)}
                  aria-current={l.videoId === videoId ? "true" : undefined}
                  className={`flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-surface-2 ${l.videoId === videoId ? "bg-accent-soft font-semibold text-accent" : ""}`}
                >
                  <span className="w-5 shrink-0 tabular-nums text-muted">{i + 1}</span>
                  <span className="flex-1">{l.title}</span>
                  <span className="shrink-0 tabular-nums text-muted">{formatTime(l.seconds)}</span>
                </button>
              </li>
            ))}
          </ol>
        )}

        {state.videos.length > 0 && (
          <ul aria-label="Your videos" className="flex flex-wrap gap-2 text-sm">
            {state.videos.map((id, i) => (
              <li key={id} className="flex items-center overflow-hidden rounded-lg bg-surface-2">
                <button type="button" onClick={() => setActive(id)} className={`min-h-11 px-3 ${id === videoId ? "font-semibold text-accent" : ""}`}>
                  Your video {i + 1}
                </button>
                <button
                  type="button"
                  aria-label={`Remove your video ${i + 1}`}
                  onClick={() => {
                    update((s) => ({ ...s, videos: s.videos.filter((v) => v !== id) }));
                    if (active === id) setActive(null);
                  }}
                  className="min-h-11 min-w-11 px-2.5 text-muted hover:text-danger"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-muted hover:text-accent">Add another video</summary>
          <form onSubmit={addVideo} className="mt-3 flex gap-2">
            <label htmlFor={`${slug}-video-url`} className="sr-only">
              YouTube video link
            </label>
            <input id={`${slug}-video-url`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a YouTube video link" className={input} />
            <button className="min-h-11 shrink-0 rounded-xl bg-accent px-4 font-bold text-accent-fg">Add</button>
          </form>
          {urlError && <p className="mt-2 text-danger">{urlError}</p>}
        </details>
      </section>

      <section aria-labelledby="notes-heading" className={`${card} space-y-3`}>
        <h2 id="notes-heading" className="text-lg font-bold">
          My notes
        </h2>
        <form onSubmit={addNote} className="space-y-3">
          <label htmlFor={`${slug}-note`} className="sr-only">
            New note
          </label>
          <textarea
            id={`${slug}-note`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote(e);
            }}
            rows={3}
            placeholder="Write what you just learned, in your own words…"
            className={input}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <label className="flex items-center gap-2 text-muted">
              <input type="checkbox" checked={stamp} onChange={(e) => setStamp(e.target.checked)} className="size-4 accent-[var(--accent)]" />
              Attach video timestamp
            </label>
            <button className="min-h-11 rounded-xl bg-accent px-4 font-bold text-accent-fg">Save note</button>
          </div>
        </form>
        {state.notes.length > 0 && (
          <ul className="space-y-2.5">
            {[...state.notes].reverse().map((n) => (
              <li key={n.id} className="group rounded-xl bg-surface-2 p-3.5 text-sm">
                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted">
                  {n.videoId && n.t !== undefined ? (
                    <button type="button" onClick={() => jumpTo(n.videoId!, n.t!)} className="font-mono font-semibold text-accent hover:underline">
                      ▶ {formatTime(n.t)}
                      {titleOf(n.videoId) && ` · ${titleOf(n.videoId)}`}
                    </button>
                  ) : (
                    <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                  )}
                  <button
                    type="button"
                    aria-label="Delete note"
                    onClick={() => update((s) => ({ ...s, notes: s.notes.filter((x) => x.id !== n.id) }))}
                    className="opacity-70 hover:text-danger group-hover:opacity-100"
                  >
                    Delete
                  </button>
                </div>
                <p className="whitespace-pre-wrap">{n.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** Sidebar: learning-outcome checklist (each links to its lesson) and module completion. */
export function ModuleChecklist({ slug, los }: { slug: string; los: Los[] }) {
  const [state, update] = useModuleState(slug);
  const losDone = new Set(state.losDone);
  return (
    <div className="space-y-3">
      <div className={`${card} space-y-3`}>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold">Learning outcomes</h2>
          <span className="text-xs font-semibold tabular-nums text-muted">
            {losDone.size}/{los.length}
          </span>
        </div>
        <p className="text-xs text-muted">Tick each one when you can explain it without looking.</p>
        <ol className="space-y-3">
          {los.map((l, i) => (
            <li key={l.id} className="flex gap-2.5 text-sm leading-snug">
              <input
                type="checkbox"
                aria-label={`Outcome ${i + 1} understood`}
                className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
                checked={losDone.has(l.id)}
                onChange={(e) =>
                  update((s) => ({ ...s, losDone: e.target.checked ? [...s.losDone, l.id] : s.losDone.filter((x) => x !== l.id) }))
                }
              />
              <div className="min-w-0 space-y-1.5">
                <a href={`#${l.id}`} className={`hover:text-accent ${losDone.has(l.id) ? "text-muted line-through" : ""}`}>
                  <span className="mr-1 font-semibold tabular-nums">{i + 1}.</span>
                  {l.text}
                </a>
                {SOURCE_GAPS[l.id] && (
                  <div className="space-y-1 rounded-lg border-l-4 border-warn bg-warn/8 p-2.5 text-xs leading-5">
                    <p>
                      <strong className="text-warn">Use the official reading for this one. </strong>
                      {SOURCE_GAPS[l.id].note}
                    </p>
                    <p className="text-muted">Make sure you cover: {SOURCE_GAPS[l.id].lookFor.join(" · ")}.</p>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
      <button
        type="button"
        aria-pressed={state.done}
        onClick={() => update((s) => ({ ...s, done: !s.done }))}
        className={`min-h-11 w-full rounded-xl px-4 font-bold ${state.done ? "bg-success text-success-fg" : "border border-control-line bg-surface hover:border-accent"}`}
      >
        {state.done ? "✓ Module complete" : "Mark module complete"}
      </button>
    </div>
  );
}
