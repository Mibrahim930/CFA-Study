import type { Metadata } from "next";
import { AccountPanel } from "@/components/account-panel";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rule-b space-y-1 pb-3">
        <h1 className="display text-[2rem]">Your account</h1>
        <p className="text-sm text-muted">
          An account saves your progress, notes, flashcard schedule and settings on the server, so your laptop and phone share one record and anyone else can
          keep theirs separate. Without one, the app works per device.
        </p>
      </div>
      <AccountPanel />
    </div>
  );
}
