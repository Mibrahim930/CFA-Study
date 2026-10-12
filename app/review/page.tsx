import type { Metadata } from "next";
import { ReviewSession } from "@/components/review-session";
import { getDeck } from "@/lib/content/deck";

export const metadata: Metadata = { title: "Review" };

export default async function ReviewPage() {
  const deck = await getDeck();
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Review</h1>
        <p className="text-muted">Flashcards from your lessons and questions you missed, scheduled by spaced repetition (FSRS).</p>
      </div>
      <ReviewSession deck={deck} />
    </div>
  );
}
