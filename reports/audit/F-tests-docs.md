# F — Audit test, CI, dan dokumentasi

Repo: `D:\.1Kuliah\Coding\Dear dia`. Branch: `fix/repo-audit`. Peran: AUDIT-F (read-only kode; hanya file ini yang ditulis).

## Ringkasan

`npm test` hijau (exit 0, 5 suite murni, tanpa browser). Tapi suite P0 (stamp) tidak ikut `npm test`, empat suite browser yang menghapus localStorage tidak punya guard localhost (di repo ini penghapusan profil asli "sudah pernah terjadi sekali", `scripts/check-live.mjs:5`), dan tidak ada CI sama sekali padahal Vercel auto-deploy `main`. 16 temuan: 1 P0, 5 P1, 10 P2. Klaim terverifikasi palsu: sanitizer "diuji oleh suite browser dan `check-features.mjs`" — nol script menyentuh sanitizer.

## Cakupan tes vs daftar risiko

Legenda: B = browser (butuh `serve-with-csp.mjs`, di luar `npm test`), M = murni Node (bisa masuk CI).

| Jalur risiko | Tes yang ada | Jenis | Celah |
|---|---|---|---|
| autosave/draft | `check-composer.mjs` (draft ditulis/dilanjut/dihapus, save saat keluar, konflik tab basi) | B, manual | Tidak di `npm test`; timer `useAutosave`/`useIdleSave` tidak diuji murni |
| import backup | hanya semantik `replaceEntries` di `check-sync-storage.mjs` | M | `parseBackup` (JSON rusak, versi lebih baru, `looksLikeEntry`/`coerceEntry`) nol tes; merge di `DataSection.tsx:29-42` nol tes |
| export JSON backup | tidak ada | — | `exportBackup` nol tes |
| export text/markdown | `check-features.mjs` #1 | B | Menyalin regex `htmlToText` ke dalam test, bukan memanggil fungsi app — hijau walau fitur rusak (F-03) |
| PDF | `check-pdf-export.mjs` (download + chunk lazy), `check-export.mjs` (paginasi, A4, nama file, Ctrl+Enter) | B | `check-export.mjs` yatim (F-10) |
| search | `check-features.mjs` #5 (filter + clear) | B | `searchIndex.ts` nol tes murni; `measure-search`/`profile-search` hanya angka, bukan assertion |
| stats | **tidak ada sama sekali** | — | `statsService`/`statsStreaks`/`statsCharts` nol referensi di seluruh `scripts/` |
| calendar | `check-features.mjs` #2 (nav bulan + panel); `check-week-bucket.mjs` (bucket minggu + `subDays` DST) | B + M | week-bucket yatim (F-10) |
| settings | `check-sync-removed.mjs` (nav, privacy copy, clear-all tombstone) | B | restore settings dari backup nol tes |
| owner-switch | `check-sync-push-deny.mjs` F1 (draft dihapus, settings dipertahankan) + `check-sync-storage.mjs` | M | push-deny **tidak** di `npm test` (F-02) |
| RLS | grep SQL di `check-sync-race.mjs:316-334` | M (teks) | Tidak ada tes perilaku; round-trip live tidak ada (didokumentasikan jujur) |
| sanitasi XSS | **tidak ada sama sekali** | — | Klaim di laporan perf menyebut "diuji browser suite" — palsu (F-04) |

Prioritas data-loss: tombstone/merge/race/owner terbaik (5 suite murni, semua di `npm test`). Yang bolong di jalur data: **parse/import backup**, **export text nyata**, **timer autosave**, dan suite **stamp** (yang justru menangkap bug P0 "edit user dibuang") tidak masuk perintah test default.

## CI

`.github/workflows` tidak ada (dikonfirmasi: `no workflows`). Risiko nyata: `main` auto-deploy Vercel tanpa satu pun gate otomatis — `typecheck`, `build`, dan `npm test` semuanya hanya jalan bila seseorang menjalankannya manual. Setup minimal yang layak (jangan lebih):

```yaml
# .github/workflows/ci.yml
name: ci
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '24', cache: 'npm' }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint:emoji
      - run: npm test
```

Cukup 5 suite murni yang sudah ada; suite browser sengaja tidak diusulkan (butuh server + Playwright global, lihat F-16). Jangan tambahkan matrix host atau job build dulu — Vercel sudah membangun `main`.

## Tabel temuan

| ID | Masalah | file:baris | Bukti/dampak | P | Effort |
|---|---|---|---|---|---|
| F-01 | Empat suite browser yang **menghapus localStorage** tidak punya guard localhost; tiga saudaranya punya. `BASE_URL` ke origin prod (konvensi `check-live.mjs:18` default prod) = diary asli terhapus permanen | `scripts/check-composer.mjs:51`, `scripts/check-features.mjs:40`, `scripts/check-pdf-export.mjs:29`, `scripts/check-export.mjs:64` (guard ada di `check-sync-removed.mjs:26-29`, `measure-search.mjs:26`, `profile-search.mjs:25`) | `check-live.mjs:5-7`: "destroying a real profile during a cleanup pass has happened once here already". Guard = 4 baris salinan | P0 | S |
| F-02 | Suite regresi P0 (stamp) + push-deny (draft owner-switch) + week-bucket tidak ikut `npm test` | `package.json:19` | Bug "edit user dibuang" (`reports/apply/99-verdict.md:36`) hanya ditangkap `check-sync-stamps.mjs` (12 checks, hijau saat dijalankan manual) — regresi tak terdeteksi oleh perintah test default | P1 | S |
| F-03 | Assertion export plain-text menguji **salinan regex** di dalam test, bukan `htmlToText` milik app | `scripts/check-features.mjs:76-86` vs `src/lib/parse.ts:23-36` | `htmlToText` diubah/dirusak → check tetap hijau. Nol script lain memanggil `htmlToText` | P1 | S |
| F-04 | Klaim "the real sanitizer is exercised by the browser suite and `check-features.mjs`" **tidak didukung bukti**; nol tes perilaku sanitasi | klaim: `reports/perf/supabase-sync-implementation.md:52-54`; bukti absen: `grep -rln "sanitize\|onerror\|xss" scripts/*.mjs` → hanya harness (stub) | `src/lib/sanitize.ts` (DOMPurify) adalah jalur keamanan; regresi XSS tidak tertangkap apa pun | P1 | M |
| F-05 | Tidak ada CI; `main` auto-deploy tanpa gate | `.github/workflows` absen; `vercel.json` + auto-deploy GitHub | Push rusak → produksi langsung. Setup minimal di atas | P1 | S |
| F-06 | README minta "Node.js 18 or newer"; `npm test` butuh type-stripping Node (≥22.6 flag, 22.18+/23.6+ default; terverifikasi 24.19). `package.json` tanpa `engines`; Vercel tidak pin Node; Netlify pin 22 | `README.md:9`; `package.json` (engines absen); `netlify.toml:6` | Node 18/20 → `npm test` gagal "Unknown file extension .ts". Laporan harness sendiri menandai fallback Node 22 "unverified" (`reports/perf/supabase-sync-implementation.md:180-182`) | P1 | S |
| F-07 | README "nothing reaches the network" bertentangan dengan DiceBear (README sendiri di baris 102 mengakui "that is a network request"; `check-sync-removed.mjs:199` mengizinkan dicebear) | `README.md:121` vs `README.md:102`, `src/constants/avatar.ts:5` | Klaim privasi terlalu kuat; seharusnya "tidak ada data entri/sync yang keluar" | P2 | S |
| F-08 | "Every folder has an `index.ts` barrel export" salah | `README.md:82`; `src/components/` dan `src/pages/` tanpa `index.ts` (terverifikasi), semua subfolder punya | Dokumen vs kenyataan | P2 | S |
| F-09 | Tabel scripts README tidak memuat `npm test` dan `npm run lint:emoji` | `README.md:25-32` vs `package.json:16,19` | Kontributor tidak tahu perintah test ada | P2 | S |
| F-10 | Dua script yatim: `check-export.mjs` (0 referensi di seluruh repo; justru berisi tes PDF lebih dalam — paginasi, A4, Ctrl+Enter — daripada `check-pdf-export.mjs`) dan `check-week-bucket.mjs` (0 referensi; hijau saat dijalankan) | `scripts/check-export.mjs`, `scripts/check-week-bucket.mjs` | Cakupan hilang dari alur siapa pun; duplikasi dengan check-pdf-export | P2 | S |
| F-11 | 17 file tmp untracked **tidak** di-ignore: `.tmp-*.mjs` (6 di root), `scripts/tmp-a11y-audit*.mjs` + `tmp-a11y-shot.mjs` (11) | `git status --untracked-files=all`; `.gitignore` | Artefak audit ini; `git add -A` akan meng-commitnya | P2 | S |
| F-12 | Assertion berbasis teks sumber, bukan perilaku: F3 push-deny (`adapter.ts` tidak bisa di-load Node) dan RPC/paginasi SQL | `scripts/check-sync-push-deny.mjs:97-103`, `scripts/check-sync-race.mjs:316-334` | Terdokumentasi jujur sebagai keterbatasan (`99-verdict.md:72-76`), tetap: guard dihapus/dipindah file → hijau palsu | P2 | M |
| F-13 | Angka di laporan sudah basi: "Four sync suites, 172 checks" (kini 6 suite sync, 198 checks: +stamps 12, +push-deny 14) dan "CSS byte-identical (7,829 bytes gzip)" (terukur kini 7,839) | `reports/perf/supabase-sync-implementation.md:10,15-17`; `reports/perf/99-final.md:45` | Pembaca mengutip angka lama; 99-final juga tak bisa diverifikasi ulang (build lama) | P2 | S |
| F-14 | `.gitignore` tidak meng-cover `.env.local.bak` (dipakai workflow `98-apply-deploy.md:34` `mv .env.local .env.local.bak`) dan pola `tmp-*`/`.tmp-*` | `.gitignore` (hanya `*.local`, `.env.local`) | Backup env berisi URL+key nyata bisa ter-commit (key saat ini **belum pernah** masuk history — dicek `git log -S`, bersih) | P2 | S |
| F-15 | Suite browser menguji `dist/` apa pun yang disajikan di port 5212; tidak ada cek kesegaran build | semua `scripts/check-*.mjs` (`BASE_URL` default `http://localhost:5212`) | Build basi di dist + server lama → hijau palsu. `check-sync-removed.mjs` satu-satunya yang gagal keras saat dist salah konfigurasi (4 FAILED terverifikasi) | P2 | S |
| F-16 | Playwright diambil dari `npm root -g`; bukan dependency project | `scripts/check-composer.mjs:14-19` dan 9 script lain | Clone bersih / CI tidak bisa menjalankan suite browser tanpa `npm i -g playwright` manual | P2 | S |

## Output mentah

```console
$ cd "D:/.1Kuliah/Coding/Dear dia"
$ ls scripts/
activate-supabase.mjs      check-sync-harness.mjs      measure-perf.mjs
check-composer.mjs         check-sync-merge.mjs        measure-routes.mjs
check-csp-parity.mjs       check-sync-push-deny.mjs    measure-search.mjs
check-export.mjs           check-sync-race.mjs         profile-search.mjs
check-features.mjs         check-sync-removed.mjs      serve-with-csp.mjs
check-live.mjs             check-sync-stamps.mjs       smoke-routes.mjs
check-pdf-export.mjs       check-sync-storage.mjs      tmp-a11y-audit*.mjs (11, untracked)
                           check-week-bucket.mjs
```

```console
$ node -e "const p=require('./package.json');console.log(JSON.stringify(p.scripts,null,2))"
{
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit --pretty false",
  "lint:emoji": "eslint src --ext .ts,.tsx",
  "sync:on": "node scripts/activate-supabase.mjs",
  "sync:off": "node scripts/activate-supabase.mjs --off",
  "test": "node scripts/check-sync-harness.mjs && node scripts/check-sync-merge.mjs && node scripts/check-sync-race.mjs && node scripts/check-sync-storage.mjs && node scripts/check-csp-parity.mjs"
}

$ ls -la .github/workflows 2>/dev/null || echo "no workflows"
no workflows

$ git ls-files | wc -l
323

$ git ls-files | grep -iE "dist/|\.temp|\.log$" || echo "no junk tracked"
no junk tracked
```

```console
$ npm test 2>&1 | tail -12
# csp parity
PASS  vercel.json carries a CSP — 286
PASS  netlify.toml carries a CSP — 286
PASS  serve-with-csp.mjs carries a CSP — 286
PASS  vercel.json and netlify.toml are byte-identical — 286 vs 286
PASS  netlify.toml and serve-with-csp.mjs are byte-identical — 286 vs 286
PASS  connect-src allows https://*.supabase.co — connect-src 'self' https://*.supabase.co wss://*.supabase.co
PASS  connect-src allows wss://*.supabase.co — connect-src 'self' https://*.supabase.co wss://*.supabase.co
PASS  no unsafe-eval anywhere in the policy — absent
PASS  script-src does not carry 'unsafe-inline' — script-src 'self'
ALL PASS
EXIT=0
```

Exit code tiap script murah (dijalankan; tanpa kredensial/live):

| Script | Exit | Checks |
|---|---|---|
| `check-sync-harness.mjs` | 0 | 4 |
| `check-sync-merge.mjs` | 0 | 43 |
| `check-sync-race.mjs` | 0 | 44 |
| `check-sync-storage.mjs` | 0 | 56 |
| `check-sync-stamps.mjs` | 0 | 12 |
| `check-sync-push-deny.mjs` | 0 | 14 |
| `check-csp-parity.mjs` | 0 | 9 |
| `check-week-bucket.mjs` | 0 | 2 |
| `smoke-routes.mjs` (server lokal aktif) | 0 | 6 route ok |
| `check-features.mjs` (server lokal) | 0 | 15 |
| `check-composer.mjs` (server lokal) | 0 | 16 |
| `check-pdf-export.mjs` (server lokal) | 0 | PASS |
| `check-sync-removed.mjs` (dist config-on) | 1 | 4 FAILED — sesuai caveat laporan, butuh build config-off |

```console
$ node scripts/check-sync-removed.mjs | grep FAIL
FAIL  no Account entry in the settings nav — Entries, Calendar, Stats, Profile, Appearance, Privacy, Account, Data, About
FAIL  no sign-in form rendered
FAIL  no link points at the sync section
FAIL  the privacy copy is the unconditional local-only line
4 FAILED   (EXIT=1; penyebab: dist di tree ini dibangun config-on, bukan regresi)
```

```console
$ node scripts/smoke-routes.mjs 2>&1 | tail -3        # tanpa server → gagal keras, tidak senyap
Error ... navigating to "http://localhost:5999/" ...   REAL_EXIT=1
$ node scripts/check-features.mjs (BASE_URL=dead)      REAL_EXIT=1, "1 FAILED"
```

```console
$ grep -rln "sanitize\|onerror\|xss" scripts/*.mjs
scripts/check-sync-harness.mjs      # hanya stub pass-through DOMPurify, bukan tes

$ gzip -c dist/assets/index-BxrW52Z5.css | wc -c
7839     # laporan perf mengklaim 7,829 (angka historis, kini tak sama)

$ git status --short --untracked-files=all | head
?? .tmp-attrib.mjs  ?? .tmp-bytes.mjs  ?? .tmp-graph.mjs  ?? .tmp-measure.mjs
?? .tmp-mods-all.mjs  ?? .tmp-mods.mjs  ?? .zcodeignore
?? scripts/tmp-a11y-audit.mjs ... (11 file)  ?? scripts/tmp-a11y-shot.mjs

$ git log --all -S "sb_publishable_<anon-key>" --oneline
(empty)  # nilai key .env.local belum pernah masuk history — bersih (literal di-redaksi di laporan ini)
```

## Handoff

1. **F-01 (P0)** — salin guard 3 baris dari `check-sync-removed.mjs:26-29` ke empat script yang menghapus storage. Satu file satu agent; jangan lupa `check-export.mjs` (yatim, lihat F-10).
2. **F-02** — tambah ke `package.json` test: `check-sync-stamps.mjs`, `check-sync-push-deny.mjs`, `check-week-bucket.mjs` (semua murni, sudah hijau).
3. **F-03** — pakai `loadSrc('lib/parse.ts')` dari harness untuk meng-assert `htmlToText` asli; hapus regex salinan.
4. **F-04** — tes sanitasi minimal yang jujur: probe browser (seed `<img src=x onerror=...>` → assert tidak dieksekusi/bersih), bukan klaim. DOMPurify butuh DOM, jadi jalur murni Node tidak tersedia.
5. **F-05** — workflow CI di atas; Node 24. Jangan tambah job build/deploy.
6. **F-06** — README: ganti requirement jadi "Node 24 (atau ≥22.18) untuk `npm test`" dan/atau tambah `engines` di `package.json`.
7. **F-10** — putuskan: hidupkan `check-export.mjs` (ganti `check-pdf-export.mjs` yang lebih dangkal) atau hapus; jalankan/daftarkan `check-week-bucket.mjs`.
8. **F-11/F-14** — `.gitignore`: tambah `.tmp-*`, `tmp-*`, `.env.local.bak`. File tmp audit jangan di-commit.
9. **F-13** — koreksi angka di laporan perf (172 → 198 checks / 6 suite sync; CSS 7,839) atau beri cap tanggal "per round".

Yang **tidak** boleh dilakukan dari audit ini: mengubah `src/` (read-only), menjalankan `check-live.mjs` (menyentuh produksi), menjalankan `measure-*` (butuh live/perf), dan `npm run sync:on` (menulis `.env.local`).
