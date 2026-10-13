# Deploying L1 Study privately (so it works on your phone)

Everything is prepared. Only the account steps need you, because Claude can't sign in to your accounts. It takes about 10 minutes. Railway is the chosen host (2026-10-13); Vercel steps are kept below as an alternative.

## What you need to know first
- **The lessons are built into the app**, so the deployed site needs **no API keys**. Never add `ANTHROPIC_API_KEY` or `YOUTUBE_API_KEY` to the host; they're only for running the content pipeline on your PC.
- **Privacy:** the repo is private, and the site is locked behind a password you choose (`APP_PASSWORD`, enforced by `proxy.ts`). On Railway or Vercel, if `APP_PASSWORD` is missing the site shows an error instead of opening to the public.
- **Your progress (finished modules, notes, flashcard schedule) is saved per device for now.** Laptop and phone won't share progress until the Supabase sync milestone. Until then, pick one device for flashcard reviews.

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
