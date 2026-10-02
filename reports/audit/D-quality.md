# Audit D — Code quality / dead code / consistency

Repo: `D:\.1Kuliah\Coding\Dear dia` · Branch: `fix/repo-audit` · Tanggal: 2026-10-02
Sifat: read-only terhadap kode. Satu file ditulis: laporan ini.
Metode: grep/`wc` mentah + dua skrip Node sekali-pakai (reachability impor & usage per-ekspor, dijalankan dari `.tmp-*.mjs` lalu dihapus; `git status` bersih setelahnya). `npx tsc --noEmit` → exit 0.

## Ringkasan

Batas baris **nol pelanggaran** (252 file, semua di bawah ambang; tertinggi `src/store/syncStore.ts` 197/200). `TODO`/`FIXME`/`XXX`/`HACK` **nol**. `any`/`@ts-ignore`/`@ts-expect-error`/non-null assertion **nol**; tsc bersih. Sisa `useSearch.ts` (dihapus di `e88a853`) **nol referensi kode** — tapi dua komentar masih menyebut "the search hook" yang sudah tidak ada. Temuan nyata: ~25 ekspor mati (helper, hook, komponen, konstanta), 8 barrel halaman yatim, dan beberapa duplikasi/komentar basi. Tidak ada P0.

## Tabel temuan

| ID | Masalah | file:baris | Bukti / dampak | Prio | Effort |
|----|---------|-----------|----------------|------|--------|
| D-01 | Ekspor mati: tidak ada konsumen di luar file definisi + barrel (bukan dead-code palsu — diverifikasi dengan skrip, bukan tebakan). **Hook:** `useDebounce`, `useLocalStorage`, `useMood`. **Komponen:** `EntryMeta` (46 baris). **Helper lib:** `formatCardDate`, `formatDateTime`, `shortId`, `escapeHtml`, `plainToHtml`, `isHtmlEmpty`, `htmlWordCount`, `normalizeText`, `sanitizeDateTime`. **Helper utils:** `sortBy`, `groupBy`, `chunk`, `unique`, `titleCase`, `dominantMood`, `searchFilterUrl`, `useIsMobile`. **Konstanta:** `ICON_SIZES` + `IconSize`, `savedIndicatorMs`. **Tipe:** `RequestStatus`, `ShareResult`, `AvatarSettings`. | `src/hooks/useDebounce.ts`, `src/hooks/useLocalStorage.ts`, `src/hooks/useMood.ts`, `src/components/entry/EntryMeta.tsx`, `src/lib/format.ts:23,18`, `src/lib/id.ts:17`, `src/lib/parse.ts:13,41,46,51`, `src/lib/validate.ts:4,39`, `src/utils/array.ts:2,10,15,21`, `src/utils/string.ts:19`, `src/utils/mood.ts:28`, `src/utils/url.ts:13`, `src/hooks/useMediaQuery.ts:21`, `src/constants/icons.ts:2,11`, `src/constants/limits.ts:16`, `src/types/common.ts:2,22`, `src/types/settings.ts:2` | Skrip usage-per-ekspor: setiap nama hanya muncul di file definisinya dan di `index.ts` barrel. Contoh: `grep -rn "useDebounce" src/` → hanya `src/hooks/useDebounce.ts:4` + `src/hooks/index.ts:4`. `chunk(`/`unique(` → nol pemanggilan. `EntryMeta` → nol impor. `ICON_SIZES` nol pemakaian padahal README:100 mengklaim "Sizes come from `ICON_SIZES`" — kode memakai angka mentah (`size={16}`, `size={20}`). Dampak: bundle & permukaan API membawa kode yang tak pernah jalan; klaim README tidak benar. | P2 | S |
| D-02 | 8 barrel halaman yatim: `index.ts` ada tapi tidak pernah diimpor siapa pun. Router memakai dynamic import langsung (`@/pages/X/X`) dan setiap halaman mengimpor relatif (`./X`), jadi barrel-nya kode mati. | `src/pages/Calendar/index.ts`, `src/pages/Dashboard/index.ts`, `src/pages/Landing/index.ts`, `src/pages/NotFound/index.ts`, `src/pages/Reader/index.ts`, `src/pages/Settings/index.ts`, `src/pages/Stats/index.ts`, `src/pages/Write/index.ts` (total 56 baris) | Skrip reachability: 9 file tak pernah diimpor dari 252; 8 di antaranya barrel halaman (yang ke-9 `src/styles/index.ts` **bukan** temuan — diimpor side-effect oleh `src/main.tsx:3`). `grep -rn "from '@/pages" src/` → kosong. | P2 | S |
| D-03 | Duplikasi helper antrean sync: `pendingCount` dan `hasPendingUpload` didefinisikan dua kali dengan implementasi identik secara logika. | `src/services/sync/outbox.ts:57` vs `src/hooks/syncQueueState.ts:15`; `src/services/sync/owner.ts:56` vs `src/hooks/syncQueueState.ts:26` | `outbox.pendingCount()` = `Object.keys(readOutbox()).length`; `syncQueueState.pendingCount()` = `Object.keys(readOutbox()).length`. `owner.hasPendingUpload()` = `Object.keys(readOutbox()).length > 0`; `syncQueueState.hasPendingUpload()` = `pendingCount() > 0`. Keduanya diekspor publik lewat `services/index.ts:38,44` dan `hooks/index.ts:16`. `SyncSection.tsx:2` mengimpor dari `@/hooks/syncQueueState`, `useSyncLifecycle.ts:3` dari `./syncQueueState`; versi `services/` dipakai `scripts/check-sync-storage.mjs:159`. Dua nama, dua jalur, satu perilaku — perubahan aturan antrean harus disunting di dua tempat. | P2 | S |
| D-04 | Duplikasi pembangun date-key lokal. `DatePicker` menulis ulang `pad`+`getFullYear/getMonth/getDate` yang sudah ada sebagai `toDateKey` di utils. | `src/components/editor/DatePicker.tsx:12,25` vs `src/utils/date.ts:19,25` | `pad()` identik dengan `pad2()`; `\`${at.getFullYear()}-${pad(at.getMonth()+1)}-${pad(at.getDate())}\`` identik dengan `toDateKey`. `toDateKey` sudah diekspor dari `@/utils` dan dipakai 23 tempat lain. `DatePicker` adalah satu-satunya penulis ulang. Dampak kecil (bukan bug) tapi dua salinan aturan format tanggal. | P2 | S |
| D-05 | Duplikasi formatter `Intl.DateTimeFormat`. `CalendarHeader` membuat instance sendiri alih-alih memakai helper bersama di `utils/formatters.ts` (yang dibuat justru untuk alasan biaya konstruksi). | `src/components/calendar/CalendarHeader.tsx:5` vs `src/utils/formatters.ts` | `new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })` dibuat ulang di komponen; komentarnya sendiri berbunyi "Locale is pinned with the other date helpers", padahal instance-nya tidak berasal dari sana. Tidak ada formatter "month-year" di `formatters.ts`, jadi ini formatter keempat di luar modul yang memusatkan formatter. | P2 | S |
| D-06 | Komentar basi menyebut `useSearch`, hook yang sudah dihapus di `e88a853`. | `src/hooks/useFilter.ts:6`, `src/types/common.ts:4` | `useFilter.ts:6` → `/** Default filter state shared by the dashboard toolbar and the search hook. */`; `common.ts:4` → `/** Filter values shared by the toolbar and the search hook. */`. `git log --diff-filter=D -- src/hooks/useSearch.ts` → dihapus di `e88a853`; `grep -rn "useSearch" src/` → hanya `useSearchParams` milik react-router (2 file), bukan hook ini. Komentar menjanjikan konsumen yang tidak ada. | P2 | S |
| D-07 | Komentar basi menyebut path yang sudah pindah: `services/sync/config.ts` tidak ada (config ada di `services/supabase/config.ts`). | `src/pages/Settings/Settings.tsx:14` | `ls src/services/sync/` → `clock engine index merge outbox owner types`; `syncEnabled` diimpor dari `@/services/supabase/config` di file yang sama (baris 4). Komentar "see `services/sync/config.ts`" menunjuk file yang tidak ada. | P2 | S |
| D-08 | Komentar menyatakan seam tes yang tidak dipakai: `createSyncStore(injected)` didokumentasikan "so a test can drive the whole flow against a stub", padahal tidak ada tes yang mengimpor `createSyncStore`/`useSyncStore`. | `src/store/syncStore.ts:48-49,52,55` | `grep -rn "createSyncStore" scripts/ src/` → hanya definisi + `store/index.ts` re-export; nol pemanggil dengan argumen. `grep -rln "syncStore\|useSyncStore" scripts/` → kosong. Parameternya sendiri tetap berguna (default arg), tapi alasan yang ditulis tidak benar. | P2 | S |
| D-09 | Barrel tidak sinkron dengan isi folder: file ada, dipakai, tapi tidak diekspor barrel folder-nya. Dua kelompok: (a) komponen yang hanya diimpor relatif — `BlockButtons`, `MarkButtons`, `ReaderStates` (`ReaderLoading`/`ReaderNotFound`), `SidebarActions`, `SidebarDetails`, `SyncSignIn`, `useSyncSignIn`; (b) helper internal yang sengaja tidak diekspor — `entryFields`, `entryQuery`, `entryWrite`, `formatters`, `readingTime`, `wordCount`, `dashboardFilters`, `useParallax`, `editorConfig`, `writeFormStart`. | `src/components/editor/EditorToolbar/index.ts`, `src/pages/Reader/index.ts`, `src/pages/Write/index.ts`, `src/pages/Settings/sections/index.ts` (grup a) | Skrip barrel-vs-folder: 17 file tidak disebut `'./<name>'` di `index.ts` folder-nya. Untuk grup (a): `grep -rn "ReaderStates"` → hanya `Reader.tsx:13` impor relatif; `SyncSignIn` hanya dari `SyncSection.tsx:4`; `BlockButtons`/`MarkButtons` hanya dari `EditorToolbar.tsx:2-3`. Tidak ada yang rusak hari ini, tapi barrel-nya berbohong soal isi folder: konsumen berikutnya yang memakai `@/pages/Reader` tidak akan menemukan `ReaderStates`. | P2 | S |
| D-10 | Duplikasi literal pesan storage penuh. Dua string berbeda untuk kondisi yang sama ("storage refused the write"), di file yang sama. | `src/pages/Write/saveError.ts:23,38` | `SAVE_ERROR_TEXT.storage = 'Storage is full, so changes will be lost when you reload.'` dan `STORAGE_FULL = 'Storage is full, so this was not saved. Export a backup.'`. Keduanya muncul di jalur yang sama: `useWriteActions.ts:51` memakai yang pertama (`setSaveError('storage')`), `:76,87` memakai `STORAGE_FULL` lewat `reportWrite`. Perbedaan wording disengaja mungkin (indikator vs toast), tapi tidak ada komentar yang menyatakan itu; pembaca berikutnya harus menebak apakah ini drift. | P2 | S |
| D-11 | Dua hook penyimpanan menumpuk tanpa batas: `useEntries` dan `useEntry` sama-sama memanggil `hydrate()`, dan `useEntry` juga `hydrate()` di dalam `useEffect` tanpa guard, sementara `useEntries` di halaman yang sama sudah melakukannya. | `src/hooks/useEntries.ts:18-20`, `src/hooks/useEntry.ts:17-19` | `useEntries` → `useEffect(() => { hydrate(); }, [hydrate])`; `useEntry` → `useEffect(() => { if (!hydrated) hydrate(); }, [hydrate, hydrated])`. `Reader.tsx:11-12` memakai keduanya sekaligus. `hydrate` sendiri idempoten (`if (get().hydrated) return;` di `entryStore.ts:45`), jadi ini bukan bug — hanya dua jalur yang mengklaim tanggung jawab bootstrap yang sama. | P2 | S |
| D-12 | `sort: string` di `EntryFilters` kehilangan tipe, lalu di-cast paksa di konsumennya. | `src/types/common.ts:12`, `src/hooks/useFilter.ts:19` | `EntryFilters.sort: string` sementara `SortOrder` sudah ada (`src/types/entry.ts:50`). `useFilter.ts:19` menambal dengan `const order = sort as SortOrder;` — `as` di sini melemahkan pengecekan: nilai `sort` dari URL/storage yang tidak dikenal akan jatuh ke `default` tanpa peringatan tipe. `dateFrom`/`dateTo` juga `string` (wajar, input mentah). | P2 | S |
| D-13 | `EntryMeta` (46 baris) adalah komponen mati dan menduplikasi baris metadata yang dirender `ReaderMetadata`. | `src/components/entry/EntryMeta.tsx:13` vs `src/pages/Reader/ReaderMetadata.tsx:29,34` | `grep -rn "EntryMeta" src/` → hanya definisi + `components/entry/index.ts:7-8`. `ReaderMetadata` merender `formatLongDate(entry.date)` dan `formatTime(entry.date)` dengan struktur baris yang sama; `EntryMeta` juga merender keduanya plus lokasi dan `MoodBadge`. Dua implementasi baris metadata, satu tidak pernah dipakai. | P2 | S |
| D-14 | `hooks/index.ts` mengekspor tipe `KeyBinding` yang tidak pernah diimpor; `Reader`/`Write` membiarkan tipe array-nya diinferensi. | `src/hooks/index.ts:11` | `grep -rn "KeyBinding" src/` → definisi (`useKeyboard.ts:4,14,43`) + re-export barrel; nol impor dari `Reader.tsx:42`/`Write.tsx:39`. Ekspor tipe mati. | P2 | S |

Tidak dilaporkan (disengaja sesuai instruksi): barrel-bypass `@/lib/date.ts`/`@/components/ui/Toast`/`@/services/supabase/config` demi perf (komentar alasannya ada di `providers.tsx:2-4`, `syncStore.ts:26-31`); komentar panjang penjelas keputusan (mis. `entryFields.ts:66-72`, `outbox.ts:9-19`, `useIdleSave.ts:22-28`); `sideEffects` di `package.json`; dynamic import Supabase.

## Output mentah

```
$ cd "D:/.1Kuliah/Coding/Dear dia"
$ find src/pages -name '*.tsx' | xargs wc -l | awk '$1>100 && $2!="total"'
$ find src/hooks -name '*.ts*' | xargs wc -l | awk '$1>80 && $2!="total"'
$ find src/services -name '*.ts' | xargs wc -l | awk '$1>120 && $2!="total"'
$ find src/utils -name '*.ts' | xargs wc -l | awk '$1>50 && $2!="total"'
$ find src/components -name '*.tsx' | xargs wc -l | awk '$1>150 && $2!="total"'
$ find src -name '*.ts*' | xargs wc -l | awk '$1>200 && $2!="total"'
   (enam perintah di atas: tidak ada output — nol pelanggaran)

$ grep -rn "TODO\|FIXME\|XXX\|HACK" src/ || echo none
none

$ grep -rn ": any\|as any\|@ts-ignore\|@ts-expect-error" src/ | head -20 || echo none
src/\pages\Settings\sections\PrivacySection.tsx:43:        This hides private entries from the app's own screens. It does not encrypt them: anything in this browser's
   (satu-satunya hit: kata "any" di dalam prosa UI, bukan tipe)

$ grep -rn "useSearch" src/ || echo "no useSearch refs"
src/\pages\Dashboard\Dashboard.tsx:2:import { useNavigate, useSearchParams } from 'react-router-dom';
src/\pages\Dashboard\Dashboard.tsx:15:  const [searchParams, setSearchParams] = useSearchParams();
src/\pages\Write\Write.tsx:1:import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
src/\pages\Write\Write.tsx:16:  const [searchParams] = useSearchParams();
   (semua useSearchParams milik react-router; hook useSearch yang dihapus: nol referensi)
```

```
$ wc -l src/store/syncStore.ts src/components/ui/Modal.tsx src/components/entry/EntryList.tsx
  197 src/store/syncStore.ts     <- tertinggi di repo, di bawah ambang 200
  147 src/components/ui/Modal.tsx
  137 src/components/entry/EntryList.tsx
```

```
$ npx tsc --noEmit --pretty false
tsc exit: 0
```

Skrip reachability (sekali pakai, dihapus setelah jalan):
```
FILES NEVER IMPORTED:
  pages/Calendar/index.ts
  pages/Dashboard/index.ts
  pages/Landing/index.ts
  pages/NotFound/index.ts
  pages/Reader/index.ts
  pages/Settings/index.ts
  pages/Stats/index.ts
  pages/Write/index.ts
  styles/index.ts          <- dikecualikan: side-effect import di main.tsx:3
total: 252 unimported: 9
```

Skrip usage-per-ekspor (119 kandidat; disaring ke yang tanpa konsumen non-barrel, non-tipe-props):
```
hooks/useDebounce.ts  ::  useDebounce   [refs: hooks/index.ts]
hooks/useLocalStorage.ts  ::  useLocalStorage   [refs: hooks/index.ts]
hooks/useMood.ts  ::  useMood   [refs: hooks/index.ts]
hooks/useMediaQuery.ts  ::  useIsMobile   [refs: hooks/index.ts]
components/entry/EntryMeta.tsx  ::  EntryMeta   [refs: components/entry/index.ts]
constants/icons.ts  ::  ICON_SIZES / IconSize   [refs: constants/index.ts]
lib/format.ts  ::  formatDateTime, formatCardDate   [refs: lib/index.ts]
lib/id.ts  ::  shortId   [refs: lib/index.ts]
lib/parse.ts  ::  escapeHtml, plainToHtml, isHtmlEmpty, htmlWordCount   [refs: lib/index.ts]
lib/validate.ts  ::  normalizeText, sanitizeDateTime   [refs: lib/index.ts]
utils/array.ts  ::  sortBy, groupBy   [refs: utils/index.ts]
utils/string.ts  ::  titleCase   [refs: utils/index.ts]
utils/mood.ts  ::  dominantMood   [refs: utils/index.ts]
utils/url.ts  ::  searchFilterUrl   [refs: utils/index.ts]
types/common.ts  ::  RequestStatus, ShareResult   [refs: types/index.ts]
types/settings.ts  ::  AvatarSettings   [refs: types/index.ts]
store/syncStore.ts  ::  createSyncStore, SyncStatus   [refs: store/index.ts]
store/settingsStore.ts  ::  applySettingsToDocument   [refs: store/index.ts]
services/exportService.ts  ::  entryAsText   [refs: (none)]
services/supabase/adapter.ts  ::  RemoteError   [refs: (none)]   <- tetap dipakai internal
services/supabase/auth.ts  ::  SyncDisabledError   [refs: (none)]   <- tetap dipakai internal
pages/Settings/sections/useSyncSignIn.ts  ::  CODE_MAX   [refs: (none)]   <- tetap dipakai internal
pages/Write/SidebarActions.tsx  ::  SidebarActionsProps   [refs: (none)]
pages/Write/SidebarDetails.tsx  ::  SidebarDetailsProps   [refs: (none)]
components/editor/EditorToolbar/BlockButtons.tsx  ::  BlockButtonsProps   [refs: (none)]
components/editor/EditorToolbar/MarkButtons.tsx  ::  MarkButtonsProps   [refs: (none)]
```

```
$ grep -rn "export function hasPendingUpload\|export function pendingCount" src --include='*.ts'
src/hooks/syncQueueState.ts:15:export function pendingCount(): number {
src/hooks/syncQueueState.ts:26:export function hasPendingUpload(): boolean {
src/services/sync/owner.ts:56:export function hasPendingUpload(): boolean {
src/services/sync/outbox.ts:57:export function pendingCount(): number {

$ grep -rn "search hook" src --include='*.ts' --include='*.tsx'
src/types/common.ts:4:/** Filter values shared by the toolbar and the search hook. */
src/hooks/useFilter.ts:6:/** Default filter state shared by the dashboard toolbar and the search hook. */

$ grep -rn "services/sync/config" src --include='*.ts' --include='*.tsx'
src/pages/Settings/Settings.tsx:14:/** Only offered when both Supabase env vars are set; see `services/sync/config.ts`. */
$ ls src/services/sync/
clock.ts  engine.ts  index.ts  merge.ts  outbox.ts  owner.ts  types.ts
```

## Handoff

- **D-01/D-02/D-13/D-14 (dead code, P2, S):** hapus atau ekspor. Urutan aman: hapus dulu yang nol konsumen mutlak (`useDebounce`, `useLocalStorage`, `useMood`, `EntryMeta`, `chunk`, `unique`, `sortBy`, `groupBy`, `titleCase`, `dominantMood`, `searchFilterUrl`, `useIsMobile`, `formatCardTime`-family, `shortId`, `escapeHtml`, `plainToHtml`, `isHtmlEmpty`, `htmlWordCount`, `normalizeText`, `sanitizeDateTime`, `RequestStatus`, `ShareResult`, `AvatarSettings`, `savedIndicatorMs`, 8 barrel halaman), lalu putuskan untuk `ICON_SIZES`: pakai (perbaiki kode agar sesuai klaim README) atau hapus (perbaiki README). Jangan lupa `src/hooks/index.ts` dan `src/lib/index.ts`/`src/utils/index.ts` harus ikut disunting atau `tsc` gagal.
- **D-03 (duplikasi sync, P2, S):** pilih satu kanonik — `services/sync/outbox.ts` dan `services/sync/owner.ts` adalah implementasinya; `hooks/syncQueueState.ts` bisa menjadi re-export tipis (ia sudah jadi lapisan nama untuk hook) atau dihapus dan konsumen diarahkan ke `@/services/sync`. Perhatikan `scripts/check-sync-storage.mjs:159` memakai jalur `services/sync`.
- **D-06/D-07/D-08 (komentar basi, P2, S):** tiga suntingan satu baris. D-08 bisa juga diselesaikan dengan menghapus parameter `injected` bila tidak ada rencana tes; tapi `createSyncStore` sudah jadi seam yang wajar, jadi memperbaiki komentarnya lebih murah.
- **D-09 (barrel tidak sinkron, P2, S):** putuskan kebijakan — bila barrel halaman memang dipertahankan sebagai permukaan publik, tambahkan ekspor yang hilang; bila tidak, hapus barrel-nya sekalian (lihat D-02).
- **D-04/D-05/D-10/D-11/D-12 (duplikasi kecil & konsistensi, P2, S):** perbaikan mekanis; tidak ada yang memblokir rilis. D-12 layak dikerjakan bersama perubahan tipe apa pun di `EntryFilters` (menyempitkan `sort` ke `SortOrder` akan menghapus `as` di `useFilter.ts:19`).
- Tidak ada P0/P1 dari sisi kualitas kode. Temuan P0/P1 repo ini ada di audit lain (C-1 performa tulis, A-01 sanitizer).
