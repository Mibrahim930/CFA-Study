# Deploying L1 Study privately (so it works on your phone)

Everything is prepared. Only the account steps need you, because Claude can't create accounts. It takes about 10 minutes.

## What you need to know first
- **The lessons are built into the app**, so the deployed site needs **no API keys**. Never add `ANTHROPIC_API_KEY` or `YOUTUBE_API_KEY` to Vercel; they're only for running the content pipeline on your PC.
- **Privacy:** the repo is private, and the site is locked behind a password you choose (`APP_PASSWORD`, enforced by `proxy.ts`).
- **Your progress (finished modules, notes, flashcard schedule) is saved per device for now.** Laptop and phone won't share progress until the Supabase sync milestone. Until then, pick one device for flashcard reviews.

## Steps
1. Go to **vercel.com** and sign up with your **GitHub** account (Mibrahim930). The free Hobby plan is enough.
2. **Add New → Project → Import** the `CFA-Study` repository. When asked, give Vercel access to that one repository only.
3. Keep the detected settings (Framework: Next.js; Build: `npm run build`).
4. Under **Environment Variables**, add `APP_PASSWORD` set to a long password of your choice. Store it in your password manager.
5. Click **Deploy**. When it finishes, open the URL and enter any username plus your password.
6. **On your phone:** open the URL. iPhone: Safari → Share → **Add to Home Screen**. Android: Chrome → menu → **Install app**.

## After that
- Every push to `main` redeploys automatically. Each pipeline run (new lessons) reaches the site once it's committed and pushed.
- If you want to stop it, open Vercel → Project → Settings → **Delete Project**.
