"use client";

import { useId } from "react";
import { saveSettings, useSettings } from "@/lib/store/settings";

/** The exam date and weekly hours goal: the two numbers the Today screen plans against. */
export function StudySettings() {
  const s = useSettings();
  const dateId = useId();
  const hoursId = useId();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label htmlFor={dateId} className="flex flex-col gap-1.5">
        <span className="caps text-muted">Exam date</span>
        <input
          id={dateId}
          type="date"
          value={s.examDate ?? ""}
          onChange={(e) => saveSettings({ examDate: e.target.value || undefined })}
          className="min-h-11 rounded-control border border-control-line bg-surface px-3 font-bold tabular-nums"
        />
      </label>
      <label htmlFor={hoursId} className="flex flex-col gap-1.5">
        <span className="caps text-muted">Hours per week</span>
        <input
          id={hoursId}
          type="number"
          min={1}
          max={60}
          value={s.weeklyHours}
          onChange={(e) => saveSettings({ weeklyHours: Math.max(1, Math.min(60, Number(e.target.value) || 1)) })}
          className="min-h-11 rounded-control border border-control-line bg-surface px-3 font-bold tabular-nums"
        />
      </label>
    </div>
  );
}
