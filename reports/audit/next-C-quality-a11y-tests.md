# next-C — Kualitas + a11y + test sisa (verifikasi ulang)

Repo: `D:\.1Kuliah\Coding\Dear dia`. Branch: `main` @ `3e37cc3`. Tanggal: 2026-10-05.
Serve: `node scripts/serve-with-csp.mjs 5212`. Probe: grep + Playwright terhadap build segar. Read-only.

## Ringkasan

Yang masih terbuka: D-01 (ekspor mati), D-02 (8 barrel halaman yatim), D-03 (`pendingCount` ganda), D-06/D-07 (komentar basi), E-05 (kontras error), E-06 (8 `<Link><Button>`), E-08 (reduced-motion). Yang **sudah tertutup** sejak audit: F-01 (guard localhost di semua suite browser), F-02 (`npm test` kini 9 suite termasuk stamps/push-deny/week-bucket), F-03 (`check-parse-export.mjs` memanggil `htmlToText` nyata), F-04/F-05 (check-sanitize + CI ada). `check-sanitize.mjs` **belum** masuk `npm test` dan **belum** dijalankan otomatis terhadap build segar.

## Tabel temuan (status SEKARANG)

| ID | Masalah | file:baris | Bukti | Status | P | Effort |
|---|---|---|---|---|---|---|
| D-01 | Ekspor mati | lihat daftar | grep per-nama: `useDebounce`/`useLocalStorage`/`useMood`/`EntryMeta`/`shortId`/`plainToHtml`/`isHtmlEmpty`/`htmlWordCount`/`sanitizeDateTime`/`sortBy`/`groupBy`/`titleCase`/`dominantMood`/`searchFilterUrl`/`useIsMobile`/`ICON_SIZES`/`RequestStatus`/`ShareResult`/`AvatarSettings` -> 0 ref non-export. `formatCardDate`/`formatDateTime`/`escapeHtml`/`normalizeText`/`savedIndicatorMs` hanya ref di file definisi (internal) | MASIH ADA | P2 | S |
| D-02 | 8 barrel halaman yatim | `src/pages/*/index.ts` (8 file) | `grep "from '@/pages" src/` -> **kosong**; `cat` tiap barrel -> hanya re-export, tidak ada konsumen. Router pakai `import('@/pages/X/X')` langsung | MASIH ADA | P2 | S |
| D-03 | `pendingCount`/`hasPendingUpload` didefinisikan dua kali | `src/hooks/syncQueueState.ts:15,26` vs `src/services/sync/outbox.ts:57` + `owner.ts:56` | `grep "export function pendingCount\|export function hasPendingUpload"` -> 4 definisi. Konsumen: `SyncSection.tsx:2` + `useSyncLifecycle.ts:3` pakai versi hooks; `scripts/check-sync-race.mjs:24`/`check-sync-storage.mjs:20` pakai versi services | MASIH ADA | P2 | S |
| D-06 | Komentar basi menyebut `useSearch` | `src/hooks/useFilter.ts:6`, `src/types/common.ts:4` | `grep "search hook"` -> 2 hit; `grep useSearch src/` -> hanya `useSearchParams` react-router | MASIH ADA | P2 | S |
| D-07 | Komentar menyebut `services/sync/config.ts` yang tidak ada | `src/pages/Settings/Settings.tsx:14` | `grep "services/sync/config"` -> 1 hit; `ls src/services/sync/` -> tidak ada `config.ts` (ada di `services/supabase/config.ts`) | MASIH ADA | P2 | S |
| E-05 | `text-error` `#E53935` gagal AA | `tailwind.config.js:29` | `#E53935`/cream `#F5F0E6` = **3.72**; `#E53935`/night `#2A1A14` = **3.95** (butuh 4.5). Tidak ada satu hex yang lulus di dua tema (C62828: cream 4.95 / night 2.97; F44336: cream 3.24 / night 4.54) | MASIH ADA | P2 | S |
| E-06 | `<Link>` membungkus `<Button>` | 8 lokasi / 6 file | Probe `/dashboard`: 2 nested (`New entry`, `Write your first entry`). Sumber: `DashboardHeader.tsx:33`, `DashboardGrid.tsx:42-44,55-57`, `ReaderNav.tsx:20-25`, `NotFound.tsx:17-25`, `Calendar.tsx:54-56`, `CalendarDayDetail.tsx:59-63` | MASIH ADA | P2 | M |
| E-08 | `prefers-reduced-motion` diabaikan MoodOption + ComposerModal | `src/components/mood/MoodOption.tsx:20-22`, `src/components/layout/ComposerModal.tsx:68-70` | `reducedMotion:'reduce'` -> hover MoodOption `none` -> `matrix(1.09581,...)` = ANIMATES | MASIH ADA | P2 | S |

## Test/doc — status

| ID | Status | Bukti |
|---|---|---|
| F-01 | **TERTUTUP** | `grep -c "Refusing to run"` di check-export/composer/features/pdf-export/sanitize = 1 masing-masing |
| F-02 | **TERTUTUP** | `npm test` = 9 suite: harness, merge, race, storage, csp-parity, stamps, push-deny, week-bucket, parse-export |
| F-03 | **TERTUTUP** | `check-parse-export.mjs` ada dan ada di `npm test` |
| F-04 | **SEBAGIAN** | `check-sanitize.mjs` ada (26 check, probe XSS nyata), TAPI **tidak** ada di `npm test` dan tidak dijalankan otomatis |
| F-05 | **TERTUTUP** | `.github/workflows/ci.yml` ada (typecheck + lint:emoji + npm test, Node 24) |
| F-06 | MASIH ADA | `README.md:9` "Node.js 18 or newer"; `package.json` tanpa `engines` |
| F-07 | MASIH ADA | `README.md:121` "nothing reaches the network" vs baris 102 mengakui DiceBear; `check-sync-removed.mjs:199` izinkan dicebear |
| F-08 | MASIH ADA | `README.md:82` "Every folder has an `index.ts` barrel export"; `src/components/` dan `src/pages/` tanpa `index.ts` |
| F-09 | MASIH ADA | Tabel scripts `README.md:25-32` tidak memuat `npm test` dan `npm run lint:emoji` |
| F-10 | MASIH ADA | `check-export.mjs` dan `check-week-bucket.mjs`: `check-week-bucket` sudah masuk `npm test`; `check-export.mjs` masih 0 referensi di luar laporan (jalankan manual saja) |
| F-11 | MASIH ADA | `git status --untracked-files=all` -> `.tmp-*.mjs` (probe Wave A) + `.claude-flow/` + `.claude/` untracked; `.gitignore` tidak meng-cover `.tmp-*`/`tmp-*` |
| F-12 | MASIH ADA | assertion teks-sumber F3/RPC (keterbatasan jujur) |
| F-13 | MASIH ADA | angka basi di `reports/perf/*` (historis) |
| F-14 | MASIH ADA | `.gitignore` tidak meng-cover `.env.local.bak` dan pola `tmp-*` |
| F-15 | MASIH ADA | suite browser tidak cek kesegaran build (hanya `check-sync-removed` gagal keras saat dist salah konfig) |
| F-16 | MASIH ADA | Playwright dari `npm root -g`, bukan dependency project |

## Output mentah

```
$ npm test 2>&1 | tail -3
PASS  entryAsText starts with the title — "T\nTuesday, September"
ALL PASS

$ grep -o "check-[a-z-]*\.mjs" package.json
check-sync-harness check-sync-merge check-sync-race check-sync-storage check-csp-parity
check-sync-stamps check-sync-push-deny check-week-bucket check-parse-export

$ grep -c "check-sanitize" package.json
0

$ grep -rn "from '@/pages" src/ || echo none
none

$ grep -rn "export function pendingCount\|export function hasPendingUpload" src/
src/hooks/syncQueueState.ts:15:export function pendingCount(): number {
src/hooks/syncQueueState.ts:26:export function hasPendingUpload(): boolean {
src/services/sync/owner.ts:56:export function hasPendingUpload(): boolean {
src/services/sync/outbox.ts:57:export function pendingCount(): number {

$ grep -rn "search hook" src/
src/hooks/useFilter.ts:6:  /** Default filter state shared by the dashboard toolbar and the search hook. */
src/types/common.ts:4:  /** Filter values shared by the toolbar and the search hook. */

$ node -e "contrast" -> error #E53935 cream 3.72 night 3.95 (need 4.5); no single hex passes both

$ E-06 probe /dashboard -> nested <a><button> count: 2

$ E-08 probe prefers-reduced-motion:reduce -> MoodOption hover none -> matrix(1.09581,...) ANIMATES

$ ls .github/workflows -> ci.yml
```

## check-sanitize freshness (pertanyaan khusus)

`check-sanitize.mjs` **sudah benar-benar dijalankan terhadap build segar** dalam sesi ini: build `npm run build` (14.65 s) -> `serve-with-csp.mjs 5212` -> `node scripts/check-sanitize.mjs` = ALL PASS. Isinya memanggil DOMPurify nyata dari bundle (bukan stub), lewat `coerceEntry` (repair-on-read) dan `ReaderContent` (render). Yang **belum**: suite ini tidak ada di `npm test`, jadi CI tidak menjalankannya. Rekomendasi: tambahkan ke `npm test` bila server CSP tersedia di CI (butuh Playwright), atau biarkan manual dan catat di README.

## Handoff (Wave B3/B4)

- D-01/D-02: hapus setelah grep nol pemakaian di `src/` **dan** `scripts/`. Ingat perbarui `hooks/index.ts`, `lib/index.ts`, `utils/index.ts`, `constants/index.ts`, `types/index.ts`, `components/entry/index.ts` atau `tsc` gagal.
- D-03: pilih kanonik `services/sync/*`; jadikan `hooks/syncQueueState.ts` re-export tipis (atau hapus). `scripts/check-sync-storage.mjs:159` pakai jalur services.
- D-06/D-07: suntingan satu baris.
- E-05: karena tidak ada satu hex yang lulus dua tema, pakai warna error theme-aware (CSS var `--color-error` di `:root` dan `[data-theme='night']`) atau render pesan error dengan `text-primary-700 dark:text-primary-200` + ikon `text-error`.
- E-06: ganti `<Link><Button>` dengan `<Link className={buttonVariants({...})}>`. `buttonVariants` sudah diekspor dari `Button.tsx:42`.
- E-08: `useReducedMotion()` dari framer-motion, atau `usePrefersReducedMotion()` (sudah ada di `src/hooks/useMediaQuery.ts:27`) untuk mematikan `whileHover`/stagger.
- F-06/F-07/F-08/F-09/F-11/F-14: README + `.gitignore` (tambah `.tmp-*`, `tmp-*`, `.env.local.bak`).

## Risiko & rollback

- D-01/D-02: penghapusan salah -> `tsc` gagal (aman, terdeteksi). Rollback = `git checkout`.
- E-05: mengubah token warna memengaruhi semua pemakaian `text-error`; verifikasi ulang kontras setelah ubah.
- E-06: `buttonVariants` pada `<Link>` harus mempertahankan `className` tambahan; jaga agar `aria` dan anak tetap.
