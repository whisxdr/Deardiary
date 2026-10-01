# 99 — Verdict (Wave 3 verifier)

Branch: `apply/supabase-sync`. Fitur: optional Supabase OTP sign-in + cross-device sync.
Verifier tidak menambah fitur. Semua perintah dijalankan di tree ini.

## VERDICT: PASS

Semua gate hijau. Tidak ada regresi. P0 tertutup dan terbukti dengan test perilaku. Batas baris, rahasia, CSP, dynamic import, dan invariant lain terpenuhi.

## Hasil per gate

| Gate | Perintah | Hasil |
|---|---|---|
| Typecheck | `npm run typecheck` | PASS, exit 0 |
| Build | `npm run build` | PASS, exit 0, built in 25.01s |
| Emoji lint | `npm run lint:emoji` | PASS, exit 0 |
| Unit + CSP | `npm test` | PASS, exit 0 (5 suite) |
| Harness | `node scripts/check-sync-harness.mjs` | ALL PASS |
| Merge | `node scripts/check-sync-merge.mjs` | ALL PASS (24 + 1 kasus oracle) |
| Race | `node scripts/check-sync-race.mjs` | ALL PASS (44, termasuk 2 kasus accepted-ids baru) |
| Storage | `node scripts/check-sync-storage.mjs` | ALL PASS (56) |
| Stamps (baru, P0) | `node scripts/check-sync-stamps.mjs` | ALL PASS (12) |
| Push-deny (baru, auth) | `node scripts/check-sync-push-deny.mjs` | ALL PASS (14) |
| CSP parity (baru) | `node scripts/check-csp-parity.mjs` | ALL PASS (9) |
| Browser routes | `node scripts/smoke-routes.mjs` | PASS, 6 route, no console errors |
| Browser features | `node scripts/check-features.mjs` | ALL PASS |
| Browser composer | `node scripts/check-composer.mjs` | ALL PASS (run kedua; run pertama flake `ERR_NETWORK_CHANGED`, lihat catatan) |
| Browser PDF | `node scripts/check-pdf-export.mjs` | PASS |
| Config-off guard | `mv .env.local .env.local.bak && npm run build && node scripts/check-sync-removed.mjs` | ALL PASS (29/29), lalu env dipulihkan + rebuild PASS |
| Batas baris | sweep pages/hooks/services/utils/components + no file >200 | PASS, 0 pelanggaran |
| Rahasia | `git grep` pola kunci + `git ls-files` env | clean; hanya `.env.example` tracked |
| CSP 3 tempat | `check-csp-parity.mjs` | IDENTIK 286 char di vercel.json, netlify.toml, serve-with-csp.mjs |

## P0 tertutup (terbukti test perilaku)

1. **Stamp tidak dikanonikalisasi** (`entryFields.ts` `safeIso`). Sebelum: `check-sync-stamps.mjs` 11 FAILED, churn `pushed per pass: 1,1,1` (loop tanpa henti), `updateEntry` mengembalikan `null` (edit user dibuang). Sesudah: ALL PASS, `pushed per pass: 0,0,0`, edit diterima. `deletedAt` ikut dinormalisasi; kunci tetap absen saat nilai tidak valid.

## P1 tertutup

| # | Temuan | Perbaikan | Bukti |
|---|---|---|---|
| 2 | Draft user A terbaca user B saat owner switch | `owner.ts` `clearLocalEntries()` menghapus `STORAGE_KEYS.draft` | `check-sync-push-deny.mjs` (draft hilang via `clearLocalEntries` dan via `claimDevice('bob-id')`; settings dipertahankan; same-account claim tidak menghapus draft) |
| 3 | Error OTP non-kode dilaporkan sebagai masalah koneksi | `authFailureMessage` (`auth.ts:43`, re-export `adapter.ts:9`); `useSyncSignIn.ts:43` memakai `error.message` | `check-sync-push-deny.mjs` kasus fungsi murni |
| 4 | RLS/sesi-mati saat push balik `[]` → antrean macet tanpa error | `adapter.ts:56-62` melempar `RemoteError` saat `rows.length>0 && accepted.length===0` | Tanpa tes otomatis (adapter butuh klien Supabase; lihat keterbatasan) |
| 5 | Form sign-in flash sebelum `restore()` selesai | `SyncSection.tsx:22,64` gate `ready` | grep + typecheck |
| 6 | Error OTP tidak diumumkan screen reader | `Input.tsx:47` `role={error ? 'alert' : undefined}` | grep + lint |
| 7 | `CODE_MAX=8` vs komentar 6..10 | `CODE_MAX=10`, komentar disamakan | grep |
| 8 | Peringatan plaintext post-consent | Kalimat pre-sign-in di `SyncSignIn.tsx:12-13` | grep |
| 9 | `SyncSignIn.tsx` 115 > 100 | 115 → 57 baris; hook ke `useSyncSignIn.ts` (74) | sweep batas baris 0 pelanggaran |
| 10 | CSP harness tidak identik | `serve-with-csp.mjs` + `upgrade-insecure-requests` | `check-csp-parity.mjs` ALL PASS; header server live diverifikasi 286 char |
| 11 | Klaim "ALL PASS (29)" tanpa syarat | `reports/perf/supabase-sync-implementation.md` dikoreksi (hijau hanya pada build config-off) | dibaca + diedit |
| 12 | Cabang retry accepted-ids tanpa tes | 2 kasus baru di `check-sync-race.mjs:329-372` | ALL PASS (44) |
| 13 | Tidak ada `npm test`; CSP tak pernah di-assert | `npm test` (5 suite) + `check-csp-parity.mjs` | `npm test` ALL PASS |

## Regresi

Tidak ada. Semua suite yang hijau di baseline (Wave 0) tetap hijau, dan `check-sync-removed.mjs` yang GAGAL di baseline (karena `dist` config-on) kini ALL PASS pada build config-off.

Catatan flake: `check-composer.mjs` run pertama gagal satu assertion `no console errors — ERR_NETWORK_CHANGED`. Run ulang bersih ALL PASS. Penyebab: flake jaringan Chrome headless, bukan kode. Tidak ada perubahan pada jalur composer di wave ini.

## Invariant keras — diverifikasi

- Tanpa emoji: `npm run lint:emoji` exit 0.
- Batas baris: 0 pelanggaran (pages<=100, hooks<=80, services<=120, utils<=50, components<=150, no file >200).
- `@supabase/supabase-js` hanya dynamic `import()` dari `src/services/supabase/client.ts`; dua import lain `import type`.
- localStorage tetap otoritatif; tulis lokal tetap sinkron.
- Tombstone, merge union-by-id, logical clock, sanitasi `coerceEntry` tidak dilepas.
- CSP `https://*.supabase.co wss://*.supabase.co` tetap ada dan IDENTIK di 3 file.
- Rahasia tidak ter-commit: `git grep` clean; hanya `.env.example` tracked; `.env.local` gitignored.
- `sideEffects`: nilai final PERSIS `["**/*.css","**/styles/**"]` seperti disyaratkan. Catatan: field ini ABSEN di `HEAD` dan DITAMBAHKAN oleh fitur ini — bukan diubah/dilepas. Nilainya sesuai invariant.

## Keterbatasan (jujur, bukan klaim palsu)

- Tidak ada tes round-trip LIVE ke Supabase (butuh kredensial). Uji manual wajib setelah deploy.
- F3 (push ditolak semua) tidak punya tes perilaku otomatis: `adapter.push` butuh klien Supabase, dan `adapter.ts` tidak bisa di-link di Node polos (named type import). Diverifikasi lewat pembacaan kode + typecheck. Uji manual di Wave 4.
- Pagination pull dan RPC accepted-ids masih diuji secara struktural (grep), bukan perilaku. Butuh stub klien PostgREST / Postgres hidup.

## Siapa memperbaiki apa

| Perbaikan | File | Agent |
|---|---|---|
| P0 stamp | `src/services/entryFields.ts` | W2-STAMP |
| F1/F2/F3 auth | `owner.ts`, `auth.ts`, `adapter.ts` | W2-AUTH |
| SYNC-01..05 + LINE-01 | `SyncSignIn.tsx`, `SyncSection.tsx`, `useSyncSignIn.ts`, `Input.tsx` | W2-UI |
| A3-06/02/03/11/13 | `check-sync-race.mjs`, `check-csp-parity.mjs`, `package.json`, laporan perf | W2-TESTS |
| CSP harness | `scripts/serve-with-csp.mjs` | Lead |
