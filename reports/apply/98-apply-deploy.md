# 98 — Apply & deploy evidence (Wave 4)

Branch kerja: `apply/supabase-sync`. Merge ke `main` setelah Wave 3 PASS.

## Commit & merge

| Item | Nilai |
|---|---|
| Commit fitur | `e88a853` — `feat: optional Supabase OTP sign-in and cross-device sync` (89 file, +6906/-202) |
| Push | `origin/apply/supabase-sync` (baru) |
| PR | https://github.com/whisxdr/Deardiary/pull/2 |
| Merge commit | `a198556` — `Merge pull request #2 from whisxdr/apply/supabase-sync` |
| Merge time | 2026-10-01T17:05:32Z, state MERGED |
| Local `main` | fast-forward ke `a198556`, working tree bersih |

## Rahasia — tidak ter-commit

- `git grep` pola kunci (`eyJ...`, `sb_secret_`, `sb_publishable_`, `service_role`) di file tracked: clean.
- Hanya `.env.example` yang tracked; `.env.local` gitignored (`.gitignore:6`).
- Tidak ada file `.temp`/rahasia di set staged (89 file diperiksa).

## Deploy Vercel

| Item | Nilai |
|---|---|
| Deployment production untuk `a198556` | id `6790381258`, dibuat 2026-10-01T17:06:07Z, status **success** |
| GitHub status | `Vercel` = success; `Supabase Preview` check = success |
| Vercel CLI lokal | TIDAK ada (`vercel: command not found`) — env host tidak diubah dari sini |

### Bukti live bundle benar-benar commit baru

Vercel membangun TANPA env Supabase, jadi bundle-nya beda dari build lokal config-on. Dibuktikan dengan menyamakan build config-off:

1. `mv .env.local .env.local.bak && npm run build` (config-off) menghasilkan `index-CJ9hAIzK.js`.
2. Live `https://dearmydiary-eight.vercel.app/` menyajikan `assets/index-CJ9hAIzK.js` (sama persis).
3. `sha256sum` byte-identik:
   - live: `7b429e419f58e1e116d08a31e3798259cc1d8a8192d78bc468aa630bb027e57f`
   - lokal config-off: `7b429e419f58e1e116d08a31e3798259cc1d8a8192d78bc468aa630bb027e57f`
4. Bundle live memuat kode sync (`Your session ended`, `Sync is not configured`) → bukan bundle pra-sync.
5. `mv .env.local.bak .env.local && npm run build` (kembali config-on) untuk memulihkan tree.

Catatan: percobaan awal tampak "tidak match" karena membandingkan live (config-off, nama chunk kasar) dengan build lokal config-on (per-route chunk). Setelah build config-off, hash identik. Bukan kegagalan deploy.

## Yang TIDAK dilakukan (butuh keputusan pemilik)

- Env host Supabase belum di-set (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Tanpa itu produksi tetap local-only: Account tidak dirender, chunk Supabase tidak diunduh, tidak ada request jaringan. Ini default yang jujur dan sesuai keputusan privasi yang masih terbuka.
- Rotasi App Password Gmail (pernah lewat chat) dan update Supabase SMTP.
- Terapkan migrasi + tambah `{{ .Token }}` ke kedua template email di project Supabase.
- Uji round-trip live (butuh kredensial; tidak ada suite otomatis).

## Sisa P2 (tidak diperbaiki, tercatat)

Lihat `00-backlog.md` bagian P2. Yang paling layak berikutnya: pagination pull dan RPC accepted-ids masih diuji struktural (grep), bukan perilaku.
