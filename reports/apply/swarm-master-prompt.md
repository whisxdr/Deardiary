# Swarm master prompt (tempel ini ke /swarm)

Jalankan audit -> fix -> verifikasi -> apply untuk fitur Supabase OTP + cross-device sync di repo
`D:\.1Kuliah\Coding\Dear dia`. Fitur sudah ADA di working tree, BELUM commit/push/deploy.
Kerja di branch `apply/supabase-sync`. Baca `reports/apply/swarm-prompt-pack.md` untuk aturan lengkap.

WAVE 1 (paralel, READ-ONLY, 5 agent):
- A1 `src/services/sync/**` + `src/services/entry{Write,Query,Fields,Service}.ts` + `supabase/migrations/*.sql`: audit data-loss (tombstone, outbox clear, merge tie, RPC accepted ids, pagination, RLS).
- A2 `src/services/supabase/**` + `src/store/syncStore.ts` + `src/hooks/useSync*.ts`: audit auth/session (owner switch, restore, sign-out, rate limit, error states).
- A3 `scripts/check-sync-*.mjs` + `reports/**`: jalankan semua suite, cari klaim palsu/lemah.
- A4 `vercel.json` + `netlify.toml` + `scripts/serve-with-csp.mjs` + `.env.example` + `README.md`: audit CSP identik 3 tempat, env host, klaim privacy.
- A5 `src/pages/Settings/sections/Sync*.tsx` + `PrivacySection/AboutSection/Footer/HeaderProfile`: audit UI/a11y/copy.
Output: `reports/apply/<NN>-audit.md`, format [ID|Masalah|file:baris|Bukti|P0/P1/P2|S/M/L].

WAVE 2 (paralel, fix P0/P1 saja, satu agent per file):
- F1 `src/services/sync/**` + migration; F2 `src/services/supabase/**` + `syncStore.ts` + `useSync*.ts` + `syncQueueState.ts`;
- F3 `entry{Write,Query,Fields,Service}.ts`; F4 `Settings/sections/**` + `components/layout/**`;
- F5 `vercel.json`/`netlify.toml`/`serve-with-csp.mjs`/`.env.example`/`README.md`; F6 `scripts/check-sync-*.mjs` + `reports/**`.
Satu commit per perbaikan. Setiap commit: test sebelum -> sesudah, tempel output.

WAVE 3 (verifier, tidak menambah fitur): jalankan SEMUA:
`npm run typecheck && npm run build && npm run lint:emoji`
`node scripts/check-sync-harness.mjs && node scripts/check-sync-merge.mjs && node scripts/check-sync-race.mjs && node scripts/check-sync-storage.mjs`
`node scripts/serve-with-csp.mjs &` lalu `smoke-routes`, `check-features`, `check-composer`, `check-pdf-export`, `check-sync-removed`
config-off guard: `mv .env.local .env.local.bak && npm run build && node scripts/check-sync-removed.mjs && mv .env.local.bak .env.local && npm run build`
cek batas baris (pages 100 / hooks 80 / services 120 / utils 50 / components 150).
Output: `reports/apply/99-verdict.md` PASS/FAIL.

WAVE 4 (apply): kalau PASS ->
`git checkout -b apply/supabase-sync && git add -A && git commit -m "feat: optional Supabase OTP sign-in and cross-device sync" && git push -u origin apply/supabase-sync`
lalu PR/merge ke `main`, set env Vercel (`vercel env add VITE_SUPABASE_URL production`, idem ANON_KEY), `vercel --prod`.

ATURAN KERAS: jangan commit `.env*`/rahasia; jangan ubah `sideEffects`; Supabase hanya dynamic import;
localStorage tetap otoritatif; tombstone/merge/clock/sanitasi jangan dilepas; CSP `*.supabase.co` tetap ada di 3 file; tanpa emoji; batas baris wajib.
