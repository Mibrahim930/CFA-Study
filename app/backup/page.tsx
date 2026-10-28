import type { Metadata } from "next";
import { BackupPanel } from "@/components/backup-panel";
import { StudySettings } from "@/components/exam-date";

export const metadata: Metadata = { title: "Back up progress" };

export default function BackupPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section id="exam" className="space-y-4">
        <div className="rule-b space-y-1 pb-3">
          <h1 className="display text-[2rem]">Your plan</h1>
          <p className="text-sm text-muted">The exam date drives the countdown on Today; the weekly goal is what the hours are measured against.</p>
        </div>
        <StudySettings />
      </section>
      <section className="space-y-4">
        <div className="rule-b space-y-1 pb-3">
          <h2 className="display text-[2rem]">Back up your progress</h2>
          <p className="text-sm text-muted">
            Your progress, notes and flashcard schedule are saved in this browser only. Clearing browser data erases them, and your laptop and phone each keep
            their own. A backup file protects them and lets you move them to another device.
          </p>
        </div>
        <BackupPanel />
      </section>
    </div>
  );
}
