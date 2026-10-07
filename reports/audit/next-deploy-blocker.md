# Deploy blocker — sync not active in production (human action required)

Repo: `D:\.1Kuliah\Coding\Dear dia`. Recorded 2026-10-05. Status: OPEN, not an agent task.

## Symptom

The live site at https://dearmydiary-eight.vercel.app/ still serves a bundle with the
Supabase sync path compiled out, even though the project has `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` set for Production and Preview.

## Evidence

- Vercel has both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Production and
  Preview (added Sep 28).
- The Vercel build runs for real (build log: tsc + vite build, 6539 modules, ~14 s), but
  the served entry chunk is `index-CMOU4_Uy.js`.
- A local build with **no** `.env.local` produces a byte-identical `index-CMOU4_Uy.js`.
- A local build **with** `.env.local` produces `index-7jYIqI7g.js` and inlines the project URL.
- Conclusion: the variable values never reached the build.

## Human steps (do NOT attempt to write host env from an agent session)

1. Vercel -> Settings -> Environment Variables: delete both `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`, then re-add them (values are in `.env.local`, which is
   gitignored).
2. Deployments -> latest deployment -> Redeploy, with "Use existing build cache" turned OFF.
3. Verify the chunk changed:
   `curl -s https://dearmydiary-eight.vercel.app/ | grep -oE 'assets/index-[A-Za-z0-9._-]+\.js'`
   It must no longer be `index-CMOU4_Uy.js`.
4. Open `/settings` and confirm the "Account and sync" section renders.

## Note

This is separate from the P2 fixes and is not touched by them. The code side of sync is
already merged and correct; only the host configuration step remains.
