# Swarm prompt pack — audit, fix, apply, deploy (DearDiary sync)

Repo: `D:\.1Kuliah\Coding\Dear dia`
Branch policy: kerja di `apply/supabase-sync`, merge ke `main` hanya setelah verifier PASS.
Live: `https://dearmydiary-eight.vercel.app` (belum punya sync).
Supabase project: `rhedtvrpcfqucrxnduxs` (tabel `entries`, RLS, RPC `upsert_entries` sudah ada).

---

## PREAMBLE — tempel di awal SETIAP prompt agent

```
KONTEKS
- Repo: D:\.1Kuliah\Coding\Dear dia (Vite 5 / React 18 / TS 5 / zustand / tiptap)
- Live: https://dearmydiary-eight.vercel.app (Vercel) + netlify.toml (Netlify)
- Supabase project: rhedtvrpcfqucrxnduxs. Tabel public.entries + RLS + RPC upsert_entries SUDAH ada.
- Fitur sync OTP + cross-device ADA di working tree, BELUM di-commit/push/deploy.
- Env app: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY di .env.local (gitignored).

ATURAN KERJA (WAJIB)
1. UKUR/RUN dulu, baru ubah. Tanpa bukti perintah + output = tidak dianggap selesai.
2. Tetap di SCOPE file agent. Temuan di luar scope -> tulis di "Handoff", jangan diperbaiki.
3. Jangan ubah perilaku fungsional/UI/konten. Perubahan harus aman visual + fungsional.
4. Commit kecil, satu perubahan per commit, pesan jelas. Kerja di branch apply/supabase-sync.
5. Jangan commit .env / .env.local / App Password / anon key. Rahasia tidak masuk git.
6. Invariant yang TIDAK boleh dilanggar:
   - Batas baris: pages<=100, hooks<=80, services<=120, utils<=50, components<=150.
   - package.json "sideEffects": ["**/*.css","**/styles/**"] jangan diubah.
   - @supabase/supabase-js hanya dynamic import() dari src/services/supabase/client.ts.
   - localStorage tetap otoritatif; tulis lokal tetap sinkron (pagehide tak tahan await).
   - Tombstone delete jangan dihapus; merge union-by-id + logical clock jangan diganti.
   - Sanitasi di boundary (coerceEntry) jangan dilepas.
   - CSP connect-src harus tetap mengizinkan https://*.supabase.co wss://*.supabase.co di vercel.json + netlify.toml + scripts/serve-with-csp.mjs (identik).
7. Tanpa emoji. Barrels (index.ts) per folder domain. Import pakai alias @/.
8. Kalau ragu, tulis rekomendasi + tingkat risiko, jangan terapkan.

FORMAT LAPORAN -> reports/apply/<NN>-<nama>.md
- Ringkasan (<=5 baris)
- Temuan: [ID | Masalah | file:baris | Bukti/dampak | P0/P1/P2 | Effort S/M/L]
- Perubahan diterapkan: commit hash + before/after (angka/output)
- Handoff
- Risiko & rollback
```

---

## WAVE 0 — Lead (koordinator, tidak ngoding)

```
PERAN: Lead.
1. Tulis reports/apply/00-state.md: peta working tree vs HEAD, daftar file baru, daftar test yang ada.
2. Pastikan baseline hijau SEBELUM wave 1:
   npm run typecheck && npm run build && npm run lint:emoji
   node scripts/check-sync-harness.mjs && node scripts/check-sync-merge.mjs
   node scripts/check-sync-race.mjs && node scripts/check-sync-storage.mjs
3. Tetapkan kepemilikan file per agent (tabel di bawah). Satu file = satu agent per wave.
4. Gabungkan temuan wave 1 -> reports/apply/00-backlog.md terurut (dampak terbesar / effort terkecil).
```

## WAVE 1 — Audit (READ-ONLY, tidak ubah kode)

| Agent | Scope | Tugas |
|---|---|---|
| 01 | `src/services/sync/**`, `src/services/entryWrite.ts`, `entryQuery.ts`, migration SQL | Audit correctness: tombstone, outbox clear, merge tie, RPC accepted-ids, pagination, RLS. Cari P0 data-loss. |
| 02 | `src/services/supabase/**`, `src/store/syncStore.ts`, `src/hooks/useSync*.ts` | Audit auth/session: owner-switch isolation, session restore, sign-out, rate limit, error states, onAuthStateChange. |
| 03 | `scripts/check-sync-*.mjs`, `scripts/check-sync-removed.mjs`, `reports/**` | Audit test coverage + klaim palsu. Jalankan semua suite, laporkan yang gagal/lemah. |
| 04 | `vercel.json`, `netlify.toml`, `scripts/serve-with-csp.mjs`, `.env.example`, `README.md` | Audit konfigurasi deploy: CSP identik 3 tempat, env Vercel/Netlify, klaim privacy vs sync, langkah setup. |
| 05 | `src/pages/Settings/sections/Sync*.tsx`, `PrivacySection.tsx`, `AboutSection.tsx`, `Footer.tsx`, `Header/HeaderProfile.tsx` | Audit UI/UX + a11y: state signed-out/in, error inline, aria, kontras, copy jujur. |

```
TUGAS (tiap agent 01-05): hanya baca. Laporkan temuan [ID|Masalah|file:baris|Bukti|P0/P1/P2|S/M/L].
Jalankan perintah verifikasi yang relevan dan tempel output mentah. Simpan ke reports/apply/<NN>-audit.md.
```

## WAVE 2 — Fix (satu agent per file, jangan tumpang tindih)

| Agent | File yang boleh diubah |
|---|---|
| 10 | `src/services/sync/**` + `supabase/migrations/*.sql` |
| 11 | `src/services/supabase/**` + `src/store/syncStore.ts` + `src/hooks/useSync*.ts` + `syncQueueState.ts` |
| 12 | `src/services/entryWrite.ts`, `entryQuery.ts`, `entryFields.ts`, `entryService.ts` |
| 13 | `src/pages/Settings/sections/**` + `src/components/layout/**` |
| 14 | `vercel.json`, `netlify.toml`, `scripts/serve-with-csp.mjs`, `.env.example`, `README.md` |
| 15 | `scripts/check-sync-*.mjs`, `reports/**` (test & laporan saja) |

```
TUGAS: perbaiki HANYA temuan P0/P1 di scope-mu. Satu commit per perbaikan.
Setiap commit: sebelum -> jalankan test -> sesudah -> jalankan test -> tempel output.
Jangan sentuh file agent lain. Jika butuh, tulis di Handoff.
```

## WAVE 3 — Verifikasi (verifier, tidak menambah fitur)

```
PERAN: Verifier. Branch: apply/supabase-sync.
Jalankan SEMUA ini dan tempel output:
  npm run typecheck
  npm run build
  npm run lint:emoji
  node scripts/check-sync-harness.mjs
  node scripts/check-sync-merge.mjs
  node scripts/check-sync-race.mjs
  node scripts/check-sync-storage.mjs
  node scripts/smoke-routes.mjs
  node scripts/check-features.mjs
  node scripts/check-composer.mjs
  node scripts/check-pdf-export.mjs
  # config-off guard (WAJIB, buktikan sync tersembunyi tanpa env):
  mv .env.local .env.local.bak && npm run build && node scripts/check-sync-removed.mjs
  mv .env.local.bak .env.local && npm run build
Cek batas baris:
  find src/pages -name '*.tsx' | xargs wc -l | awk '$1>100 && $2!="total"'
  find src/hooks -name '*.ts*' | xargs wc -l | awk '$1>80 && $2!="total"'
  find src/services -name '*.ts' | xargs wc -l | awk '$1>120 && $2!="total"'
  find src/utils -name '*.ts' | xargs wc -l | awk '$1>50 && $2!="total"'
  find src/components -name '*.tsx' | xargs wc -l | awk '$1>150 && $2!="total"'
Cek tidak ada rahasia ter-commit:
  git grep -nE "sb_publishable_|sb_secret_|scdw|app password" -- . ':!*.md' || echo clean
OUTPUT: reports/apply/99-verdict.md -> PASS/FAIL + daftar regresi + siapa yang perbaiki.
```

## WAVE 4 — Apply & Deploy (setelah verifier PASS)

```
1. Commit + push (branch, bukan langsung main):
   git checkout -b apply/supabase-sync
   git add -A && git commit -m "feat: optional Supabase OTP sign-in and cross-device sync"
   git push -u origin apply/supabase-sync
   # buka PR ke main, atau kalau disetujui langsung:
   git checkout main && git merge --no-ff apply/supabase-sync && git push origin main

2. Set env di host (Vite inline saat build -> WAJIB redeploy):
   vercel env add VITE_SUPABASE_URL production      # tempel URL
   vercel env add VITE_SUPABASE_ANON_KEY production # tempel anon key
   vercel --prod
   # Netlify: Site configuration > Environment variables (dua nama sama), lalu Deploy.

3. Verifikasi live setelah deploy:
   node scripts/measure-routes.mjs   # BASE_URL=https://dearmydiary-eight.vercel.app
   # buka live /settings -> Account muncul, kirim kode, sign-in, tulis entry,
   # sign-in di browser/incognito lain -> entry muncul.
```

---

## COMMAND RINGKAS (Git Bash)

```bash
cd "D:/.1Kuliah/Coding/Dear dia"

# Baseline
npm run typecheck && npm run build && npm run lint:emoji

# Unit suites
node scripts/check-sync-harness.mjs
node scripts/check-sync-merge.mjs
node scripts/check-sync-race.mjs
node scripts/check-sync-storage.mjs

# Browser suites (butuh server CSP)
node scripts/serve-with-csp.mjs &            # http://localhost:5212
node scripts/smoke-routes.mjs
node scripts/check-features.mjs
node scripts/check-composer.mjs
node scripts/check-pdf-export.mjs
node scripts/check-sync-removed.mjs          # config-off guard

# Supabase lokal (butuh Docker)
npx supabase start
npx supabase db push

# Aktifkan / matikan sync di build lokal
npm run sync:on -- https://rhedtvrpcfqucrxnduxs.supabase.co <anon-key>
npm run sync:off
```

---

## HANDOFF / RISIKO (isi manual sebelum deploy)

- [ ] Rotasi App Password Gmail (pernah lewat chat). Buat baru, update di Supabase > Authentication > Emails > SMTP.
- [ ] Putuskan: diary pribadi ter-upload plaintext ke Supabase? Kalau tidak, biarkan `syncEnabled=false` di produksi.
- [ ] `deardiary:owner` menyimpan Supabase user id; ganti akun akan mengosongkan entri lama (by design).
- [ ] `src/services/supabase/types.ts` mengklaim tanpa token, padahal SDK simpan access+refresh di localStorage. CSP ketat adalah kontrol kompensasi.
- [ ] Pull dibatasi `.range` per 1000; cukup untuk diary pribadi.
- [ ] Belum ada live round-trip di suite otomatis (butuh kredensial). Uji manual wajib setelah deploy.
