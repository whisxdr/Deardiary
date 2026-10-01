# 00 — Wave 0 state (lead)

Repo: `D:\.1Kuliah\Coding\Dear dia`. Branch kerja: `apply/supabase-sync` (dibuat dari `main` @ 315040d).
Fitur sync OTP + cross-device ADA di working tree, belum commit. `main` HEAD = `revert: remove the account and sync feature`.

## Working tree vs HEAD

Baru (untracked, 18 entri):
- `src/services/sync/` (clock, engine, index, merge, outbox, owner, types)
- `src/services/supabase/` (adapter, auth, client, config, index, mapper)
- `src/store/syncStore.ts`
- `src/hooks/syncQueueState.ts`, `useSyncLifecycle.ts`, `useSyncOnReturn.ts`
- `src/pages/Settings/sections/SyncSection.tsx`, `SyncSignIn.tsx`
- `supabase/` (config.toml, migrations/20261001000000_entries.sql, templates/confirmation.html, templates/magic_link.html)
- `scripts/check-sync-{harness,merge,race,storage}.mjs`, `check-pdf-export.mjs`, `smoke-routes.mjs`, `measure-routes.mjs`, `activate-supabase.mjs`
- `reports/`

Dimodifikasi (35 file): entry layer (`entryWrite/Query/Fields/Service.ts`), `store/index.ts`, `services/index.ts`, `types/entry.ts`, `constants/storageKeys.ts`, Settings sections, layout (Footer, HeaderProfile, ComposerModal), config (vercel.json, netlify.toml, serve-with-csp.mjs, .env.example, README.md, package.json).
Dihapus: `src/hooks/useSearch.ts` (staged delete).

## Baseline (SEBELUM wave 1) — HIJAU

| Perintah | Hasil |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0, built in 18.65s |
| `npm run lint:emoji` | exit 0 |
| `node scripts/check-sync-harness.mjs` | ALL PASS |
| `node scripts/check-sync-merge.mjs` | ALL PASS (24 kasus oracle) |
| `node scripts/check-sync-race.mjs` | ALL PASS |
| `node scripts/check-sync-storage.mjs` | ALL PASS |

## Batas baris — SUDAH ADA 2 PELANGGARAN

| File | Baris | Batas | Status |
|---|---|---|---|
| `src/store/syncStore.ts` | 197 | 80 (hooks) / 120 (services) | FAIL — store belum punya batas eksplisit di pack; pakai 120 (services) sebagai acuan |
| `src/pages/Settings/sections/SyncSignIn.tsx` | 115 | 100 | FAIL |

Semua file sync lain dalam batas (max services 119/120 = `sync/merge.ts`, migration 118 baris).

## CSP

`https://*.supabase.co wss://*.supabase.co` hadir di `vercel.json:13`, `netlify.toml:28`, `scripts/serve-with-csp.mjs:19`. Perlu verifikasi string CSP identik 3 tempat (A4).

## Env

`.env.local` ada, gitignored (`.gitignore` baris `*.local`, `.env.local`). `.env.example` mendokumentasikan `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` sebagai opsional.

## Kepemilikan file per agent (wave 2)

| Agent | File |
|---|---|
| F1 | `src/services/sync/**`, `supabase/migrations/*.sql` |
| F2 | `src/services/supabase/**`, `src/store/syncStore.ts`, `src/hooks/useSync*.ts`, `src/hooks/syncQueueState.ts` |
| F3 | `src/services/entry{Write,Query,Fields,Service}.ts` |
| F4 | `src/pages/Settings/sections/**`, `src/components/layout/**` |
| F5 | `vercel.json`, `netlify.toml`, `scripts/serve-with-csp.mjs`, `.env.example`, `README.md` |
| F6 | `scripts/check-sync-*.mjs`, `reports/**` |
