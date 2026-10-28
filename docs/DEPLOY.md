# Deploying L1 Study privately (so it works on your phone)

Everything is prepared. Only the account steps need you, because Claude can't sign in to your accounts. It takes about 10 minutes. Railway is the chosen host (2026-10-13); Vercel steps are kept below as an alternative.

## What you need to know first
- **The lessons are built into the app**, so the deployed site needs **no API keys**. Never add `ANTHROPIC_API_KEY` or `YOUTUBE_API_KEY` to the host; they're only for running the content pipeline on your PC.
- **Privacy:** the repo is private, and the site is locked behind a password you choose (`APP_PASSWORD`, enforced by `proxy.ts`). On Railway or Vercel, if `APP_PASSWORD` is missing the site shows an error instead of opening to the public. Accounts sit behind that same gate: the password keeps the content private, an account keeps each person's progress separate.
- **Progress is saved per device until you add the database (next section).** With it, each person creates an account on `/account` and their progress, notes, flashcard schedule and settings follow them to any device.

## Accounts: add a Postgres database on Railway (about two clicks)
1. In the Railway project, click **+ New → Database → Add PostgreSQL**. Railway creates a `Postgres` service next to the app.
2. Open the **app** service → **Variables** → **+ New Variable** → **Add Reference** → pick the Postgres service's `DATABASE_URL`. (Railway offers it as `${{Postgres.DATABASE_URL}}`; the private-network URL is fine and free of egress charges.) Save; the app redeploys.
3. Open the site → **Account** (left rail, or the footer link) → **Create account**. The app creates its three tables on first use; there is nothing to run by hand.
4. On the phone: open the site, sign in with the same email. If the phone already has progress, the app asks which copy to keep.

What to know:
- **No emails are sent**, so there is no "forgot password" link. A signed-in user can change their password on `/account`. If someone forgets theirs, reset it from the Postgres service's **Data** tab (or `psql`): delete their row in `sessions`, then set `users.password_hash` to a hash made with `npx tsx -e "import('./lib/server/auth').then(a=>a.hashPassword('newpassword').then(console.log))"` run in the repo.
- **Signing out clears that device's copy** (the account keeps everything), so a shared laptop starts clean for the next person.
- Sync is last-write-wins per record; if two devices change the same thing while offline, the later change wins. Normal use (one device at a time) never hits this.
- The Postgres service is included in Railway's usage; a few users' progress is a few megabytes.

## Railway steps
1. Go to **railway.com** and sign in (GitHub sign-in is easiest).
2. **New Project → Deploy from GitHub repo** and pick `CFA-Study`. If Railway asks for GitHub access, grant it to that one repository only.
3. Open the service → **Variables** → **New Variable**: `APP_PASSWORD` set to a long password of your choice. Store it in your password manager. (If the first deploy finishes before you add it, the site just shows a "Set APP_PASSWORD" message; adding the variable redeploys.)
4. Keep the detected settings. Railway sees Next.js and runs `npm run build`, then `npm run start` (Next reads Railway's `PORT` automatically).
5. Service → **Settings → Networking → Generate Domain**. Open that URL and enter any username plus your password.
6. **On your phone:** open the URL. iPhone: Safari → Share → **Add to Home Screen**. Android: Chrome → menu → **Install app**.

**Cost:** Railway isn't free beyond its trial. The Hobby plan is $5/month and includes $5 of usage, which a one-person app like this should fit in. Check the Usage page after the first week.

## Alternative: Vercel (free Hobby plan)
1. Sign up at **vercel.com** with GitHub, then **Add New → Project → Import** `CFA-Study` (access to that one repository only).
2. Keep the detected settings, add `APP_PASSWORD` under **Environment Variables**, and click **Deploy**.

## After that
- Every push to `main` redeploys automatically. Each pipeline run (new lessons) reaches the site once it's committed and pushed.
- To stop it: Railway → Project → Settings → **Delete Project** (or the same in Vercel).
