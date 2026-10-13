import type { Metadata } from "next";
import { BackupPanel } from "@/components/backup-panel";

export const metadata: Metadata = { title: "Back up progress" };

export default function BackupPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Back up your progress</h1>
        <p className="text-muted">
          Your progress, notes and flashcard schedule are saved in this browser only. Clearing browser data erases them, and your laptop and phone each keep their
          own. A backup file protects them and lets you move them to another device.
        </p>
      </div>
      <BackupPanel />
    </div>
  );
}
