# 00 — Backlog terurut (gabungan Wave 1)

Sumber: `01-audit.md` (data-loss), `02-audit.md` (auth/session), `03-audit.md` (test), `04-audit.md` (deploy), `05-audit.md` (UI/a11y).
Urutan: dampak terbesar / effort terkecil. Hanya P0/P1 masuk Wave 2.

## P0 (wajib)

| # | Temuan | Akar | file:baris | Effort | Agent |
|---|---|---|---|---|---|
| 1 | Stamp/date tidak dikanonikalisasi; merge & guard tulis string-compare | `safeIso` mengembalikan string mentah | `entryFields.ts:41-45`, `:94` | S | W2-STAMP |

Dampak terukur (repro lead, terverifikasi): `Z` vs `+00:00` instant sama → string beda → `key()` beda → tie menang lokal → `bump` + push tiap pass → 5 pass idle = 5 push, stamp maju terus. Menutup sekaligus A1-F1 (churn/loop) dan A1-F2 (`updateEntry` men-drop edit user diam-diam di `entryWrite.ts:44`).

## P1 (wajib)

| # | Temuan | file:baris | Effort | Agent |
|---|---|---|---|---|
| 2 | Owner switch tidak mengosongkan draft (konten privat user A terbaca user B) | `sync/owner.ts:19-22` | S | W2-AUTH |
| 3 | Error OTP non-kode (429 rate limit) dilaporkan salah sebagai masalah koneksi | `supabase/auth.ts:37-44`, `SyncSignIn.tsx:47,59` | S | W2-AUTH |
| 4 | RLS/sesi-mati saat push balik `[]` → antrean macet tanpa error | `supabase/adapter.ts:45-48` | M | W2-AUTH |
| 5 | Tidak ada gate `ready`: form sign-in flash sebelum `restore()` selesai | `SyncSection.tsx:36`, `syncStore.ts:119-156` | S | W2-UI |
| 6 | Error OTP async tidak diumumkan ke screen reader (tanpa `role="alert"`) | `SyncSignIn.tsx:84`, `ui/Input.tsx:46-52` | S | W2-UI |
| 7 | `CODE_MAX=8` bertentangan dengan komentar "6 to 10"; `otp_length` 9/10 memblokir sign-in | `SyncSignIn.tsx:12-14,26-27,81` | S | W2-UI |
| 8 | Peringatan "plain text ke server" baru muncul SETELAH sign-in (post-consent) | `SyncSignIn.tsx:63-65`, `SyncSection.tsx:58-61` | S | W2-UI |
| 9 | `SyncSignIn.tsx` 115 baris > batas pages 100 | `SyncSignIn.tsx` | S | W2-UI |
| 10 | CSP harness lokal tidak byte-identik dengan header deploy (hilang `upgrade-insecure-requests`) | `scripts/serve-with-csp.mjs:12-24` | S | Lead |
| 11 | Klaim "ALL PASS (29)" di laporan perf tidak berlaku di tree ini (butuh build config-off) | `reports/perf/supabase-sync-implementation.md:102` | S | W2-TESTS |
| 12 | Cabang retry accepted-ids di `engine.ts:68-88` tanpa tes perilaku | `scripts/check-sync-race.mjs` | S | W2-TESTS |
| 13 | Tidak ada `npm test`; CSP 3 tempat tak pernah di-assert | `package.json`, `scripts/` | S | W2-TESTS |

## P2 (tidak diperbaiki di wave ini — handoff)

- A1-F3 `engine.ts:82` `pushed` dari `outgoing.length` (kosmetik).
- A1-F4 / A3-04 / A3-05 pagination + RPC hanya grep, bukan perilaku.
- A2-F4 `resume` pakai `getSession()` lokal; komentar kontrak `types.ts:36-37` menyatakan validasi server.
- A2-F5 race sign-out vs pass in-flight; A2-F6 `verifyCode` tanpa guard `enabled()`; A2-F7 unsubscribe `onAuthChange` racy (dormant); A2-F8 `pendingCount` tidak reaktif; A2-F9 `restore` catch → `offline` dengan `account:null`.
- A4-C2 `img-src https:` lebar (tradeoff fitur URL image); A4-C3 `.env.example` memuat 2 env mati; A4-C4 Vercel tidak pin Node.
- A5-SYNC-06 fokus tidak pindah ke input kode; SYNC-07 fokus menu HeaderProfile; SYNC-08 `aria-busy`; SYNC-10 copy toggle private.

## Kepemilikan file Wave 2 (satu file = satu agent)

| Agent | File |
|---|---|
| W2-STAMP | `src/services/entryFields.ts`, `scripts/check-sync-stamps.mjs` (baru) |
| W2-AUTH | `src/services/supabase/auth.ts`, `src/services/supabase/adapter.ts`, `src/store/syncStore.ts`, `src/services/sync/owner.ts` |
| W2-UI | `src/pages/Settings/sections/SyncSignIn.tsx`, `SyncSection.tsx`, `sections/index.ts`, `PrivacySection.tsx`, file sibling baru |
| W2-TESTS | `scripts/check-sync-race.mjs`, `scripts/check-csp-parity.mjs` (baru), `package.json` (scripts), `reports/perf/supabase-sync-implementation.md` |
| Lead | `scripts/serve-with-csp.mjs` |

Aturan yang dijaga di setiap perbaikan: tanpa emoji; batas baris; `sideEffects` tidak diubah; Supabase hanya dynamic import; localStorage tetap otoritatif; tombstone/merge/clock/sanitasi tidak dilepas; CSP `*.supabase.co` tetap ada di 3 file.
