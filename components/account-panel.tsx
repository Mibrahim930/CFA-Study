"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { useNow } from "@/lib/store/review";
import { changePassword, keepAccount, keepDevice, signIn, signOut, signUp, syncNow, useSyncStatus } from "@/lib/store/sync";

const field = "min-h-11 w-full rounded-control border border-control-line bg-surface px-3 text-[0.9375rem]";
const primary = "min-h-11 rounded-control bg-accent px-5 font-bold text-accent-fg disabled:opacity-50";
const secondary = "min-h-11 rounded-control border border-control-line bg-surface px-4 font-semibold hover:border-accent disabled:opacity-50";

function ago(t: number | null, now: number | null): string {
  if (t === null || now === null) return "";
  const mins = Math.round((now - t) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  return new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Sign in, create an account, pick a side on first sign-in, sync status, sign out, change password. */
export function AccountPanel() {
  const s = useSyncStatus();
  const now = useNow();

  if (s.enabled === null) return <p className="text-muted">Checking your account…</p>;
  if (!s.enabled) {
    return (
      <section className="space-y-3 rounded-tile border border-line bg-surface p-6">
        <h2 className="text-lg font-bold">Accounts aren&apos;t set up on this server</h2>
        <p className="text-muted">
          Your progress is saved on this device only. To sign in from several devices, the host needs a Postgres database linked to the app (about two clicks on
          Railway; see <code className="rounded bg-surface-2 px-1">docs/DEPLOY.md</code>). Until then, use{" "}
          <Link href="/backup" className="font-bold text-accent hover:underline">
            backups
          </Link>{" "}
          to move progress between devices.
        </p>
      </section>
    );
  }
  if (s.user && s.choice) return <ChooseSide email={s.user.email} />;
  if (s.user) {
    return (
      <div className="space-y-6">
        <section className="space-y-3 rounded-tile border border-line bg-surface p-6">
          <h2 className="text-lg font-bold">Signed in as {s.user.email}</h2>
          <p className="text-muted" aria-live="polite">
            {s.state === "syncing"
              ? "Syncing…"
              : s.state === "error"
                ? `Couldn't sync: ${s.error} Your changes are kept on this device and will be sent when the connection is back.`
                : s.lastSyncAt
                  ? `Everything on this device is saved to your account. Last synced ${ago(s.lastSyncAt, now)}.`
                  : "Your progress is saved to your account."}
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void syncNow()} disabled={s.state === "syncing"} className={secondary}>
              Sync now
            </button>
            <SignOutButton />
          </div>
        </section>
        <ChangePassword />
      </div>
    );
  }
  return <SignInOrUp error={s.error} />;
}

function SignInOrUp({ error }: { error: string | null }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(error);
  const emailId = useId();
  const pwId = useId();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const err = mode === "in" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (err) setMessage(err);
  };

  return (
    <section className="space-y-4 rounded-tile border border-line bg-surface p-6">
      <div className="flex gap-2" role="tablist" aria-label="Sign in or create an account">
        {(["in", "up"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setMessage(null);
            }}
            className={`min-h-11 rounded-full px-4 font-extrabold ${mode === m ? "bg-accent text-accent-fg" : "border-[1.5px] border-rule hover:bg-surface-2"}`}
          >
            {m === "in" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted">
        {mode === "in"
          ? "Your account's progress replaces or joins what is on this device; you'll be asked if both have something."
          : "The progress already on this device becomes the new account's. Use at least 8 characters for the password."}
      </p>
      <form onSubmit={submit} className="space-y-3">
        <label htmlFor={emailId} className="block space-y-1.5">
          <span className="caps text-muted">Email</span>
          <input id={emailId} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </label>
        <label htmlFor={pwId} className="block space-y-1.5">
          <span className="caps text-muted">Password</span>
          <input
            id={pwId}
            type="password"
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            required
            minLength={mode === "up" ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
          />
        </label>
        {message && (
          <p role="alert" className="rounded-control border-l-4 border-danger bg-danger/8 p-3 text-sm">
            {message}
          </p>
        )}
        <button type="submit" disabled={busy} className={primary}>
          {busy ? "One moment…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
      </form>
      <p className="text-xs text-muted">No emails are sent, so there is no password reset by email. Keep the password in your password manager.</p>
    </section>
  );
}

function ChooseSide({ email }: { email: string }) {
  const [busy, setBusy] = useState<"account" | "device" | null>(null);
  return (
    <section role="alertdialog" aria-labelledby="choose-title" aria-describedby="choose-detail" className="space-y-4 rounded-tile border-2 border-accent bg-accent-soft p-6">
      <h2 id="choose-title" className="text-lg font-bold">
        This device and your account both have progress
      </h2>
      <p id="choose-detail" className="text-sm">
        You signed in as {email}. Which copy do you want to keep? The other is replaced. If unsure, keep the account and download a backup of this device first
        from the{" "}
        <Link href="/backup" className="font-bold text-accent hover:underline">
          backup page
        </Link>
        .
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          autoFocus
          disabled={busy !== null}
          onClick={async () => {
            setBusy("account");
            await keepAccount();
            setBusy(null);
          }}
          className={primary}
        >
          {busy === "account" ? "Loading your account…" : "Keep my account's progress"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={async () => {
            setBusy("device");
            await keepDevice();
            setBusy(null);
          }}
          className={secondary}
        >
          {busy === "device" ? "Uploading…" : "Keep this device's progress"}
        </button>
      </div>
    </section>
  );
}

function SignOutButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  if (!confirm) {
    return (
      <button type="button" onClick={() => setConfirm(true)} className={secondary}>
        Sign out
      </button>
    );
  }
  return (
    <div className="w-full space-y-2 rounded-control bg-surface-2 p-4 text-sm">
      <p>Signing out clears this device&apos;s copy so the next person starts clean. Your account keeps everything; sign in again to continue.</p>
      {message && (
        <p role="alert" className="font-semibold text-danger">
          {message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setMessage(await signOut());
            setBusy(false);
          }}
          className={primary}
        >
          {busy ? "Saving…" : "Sign out and clear this device"}
        </button>
        <button type="button" onClick={() => setConfirm(false)} className={secondary}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const curId = useId();
  const nextId = useId();
  return (
    <details className="rounded-tile border border-line bg-surface p-6">
      <summary className="cursor-pointer text-lg font-bold">Change password</summary>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const err = await changePassword(current, next);
          setBusy(false);
          setMessage(err ? { ok: false, text: err } : { ok: true, text: "Password changed. Other devices will need to sign in again." });
          if (!err) {
            setCurrent("");
            setNext("");
          }
        }}
        className="mt-4 space-y-3"
      >
        <label htmlFor={curId} className="block space-y-1.5">
          <span className="caps text-muted">Current password</span>
          <input id={curId} type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} className={field} />
        </label>
        <label htmlFor={nextId} className="block space-y-1.5">
          <span className="caps text-muted">New password</span>
          <input id={nextId} type="password" autoComplete="new-password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} className={field} />
        </label>
        {message && (
          <p role={message.ok ? "status" : "alert"} className={`text-sm font-semibold ${message.ok ? "text-success" : "text-danger"}`}>
            {message.text}
          </p>
        )}
        <button type="submit" disabled={busy} className={secondary}>
          Change password
        </button>
      </form>
    </details>
  );
}
