# Performance / bundle audit — DearDiary (audit C)

Date: 2026-10-02
Branch: `fix/repo-audit` @ `66750f8`
Build: Vite 5 / React 18 / TS 5, `npm run build` pass
Method: local production build served by `scripts/serve-with-csp.mjs`, Playwright with 4x CPU throttle (network profile only for transfer numbers). Chunk graph and per-chunk byte attribution computed from `dist` + sourcemaps. Read-only: no source file changed.

## Ringkasan

Defect barrel ronde 1 (jspdf + html2canvas, framer-motion) terkonfirmasi sudah beres dan tidak muncul lagi. Yang **masih ada** semuanya di jalur runtime, bukan byte: setiap tulisan (`favorite`, autosave, publish) membaca ulang + men-coerce seluruh koleksi, dan `coerceEntry` menjalankan DOMPurify + `countWords` regex per entri. Satu klik bintang pada 400 entri memblokir main thread **1.3 s** (profil CPU: DOMPurify ~1.7 s self time dari satu toggle), dan `memo(EntryCard)` masih dirender 12/12 padahal klaim ronde 2 adalah sudah beres. Halaman tulis memblokir ~**50 ms per ketikan**, `/stats` satu task **843-1354 ms**. Boot hanya mengirim **105.3 KiB gzip** JS dan tidak memuat supabase/canvg.

## Tabel temuan

| ID | Masalah | file:baris | Bukti / dampak (angka) | P | Effort |
|---|---|---|---|---|---|
| C-1 | Setiap write men-coerce seluruh koleksi: `listEntries()` 3x per toggle, tiap kali `records.map(coerceEntry)` menjalankan `sanitizeEntryHtml` (DOMPurify) + `countWords` (regex) per entri | `src/services/entryQuery.ts:7,11`, `src/services/entryFields.ts:68,74,75`, `src/store/entryStore.ts:65-67` | 400 entri: 1 klik bintang = long task **1309 ms** main-thread block (wall 3222 ms termasuk 300 ms sleep harness); 3 `getItem(entries)` + `setItem(entries)` 1.15 MiB. Profil CPU satu toggle: `parseFromString` 597 ms + `sanitize` 260 ms + internal DOMPurify ~800 ms ≈ **1.7 s self time**, 51% idle. Reproduksi terukur jalur coerce: **1093 ms per 400 entri** (100 entri: 350 ms). Skala: 50 entri 469 ms, 200 entri 2083 ms | **P0** | M |
| C-1b | `memo(EntryCard)` tetap jebol: `coerceEntry` mengalokasi objek `entry` baru tiap read, jadi props berubah identitas dan memo tidak pernah skip. Perbaikan ronde 2 (callback stabil) hanya menutup separuh sebab | `src/components/entry/EntryCard/EntryCard.tsx:19`, `src/services/entryFields.ts:68`, `src/pages/Dashboard/Dashboard.tsx:74-82` | 1 klik bintang, 200 entri, 12 kartu ter-mount: **1 commit, 215 komponen render**, 24 komponen ber-prop `entry` = **12/12 kartu dirender ulang** padahal hanya 1 yang datanya berubah (probe hook DevTools, flag `PerformedWork`). Ronde 2 mengklaim R-1 beres; bukti ini menunjukkan tidak | **P1** | S |
| C-2 | Search cache (`WeakMap` keyed on entry object) mati setiap store write, karena `coerceEntry` mengalokasi objek baru tiap read | `src/lib/searchIndex.ts:12-22`, `src/services/entryFields.ts:68` | 400 entri, filter cocok-semua: cold **179 ms** → warm **64 ms** → setelah satu toggle **153 ms** (kembali cold). Setiap write = rebuild index penuh: `stripHtml` atas 400 body | **P1** | S |
| C-3 | Halaman tulis: editor menghitung `countWords`+`countCharacters` (regex penuh atas seluruh body) tiap `onUpdate`, autosave `JSON.stringify(deps)` tiap render | `src/pages/Write/useEditorSetup.ts:52-56`, `src/hooks/useAutosave.ts:39` | 20 ketikan berjarak 40 ms: **1007-1049 ms total long task** (≈50% dari rentang 800 ms+40 ms*20), worst single task **235-369 ms** → per ketikan ≈ **50 ms** blocked. Independen dari jumlah entri (0 vs 400 sama), jadi bebannya editor sendiri, bukan storage | **P1** | M |
| C-4 | `/stats` mount menghitung `computeStats` multi-pass + render recharts dalam satu task | `src/pages/Stats/Stats.tsx:17`, `src/services/statsService.ts:29-56` | 400 entri: satu task **843 ms** (reload) / **1354 ms** (nav), total 1892 ms dalam 5 task. Chart muncul setelah 1124 ms. Reproduksi beban 10-pass setara terukur hanya 26.5 ms, jadi dominannya render recharts (262.9 KiB / 63% chunk) — perlu satu putaran ukur terpisah untuk memisahkan keduanya | **P1** | M |
| C-5 | Theme flash: `data-theme` ditulis hanya dari `settingsStore.hydrate()`, tidak ada inline script pra-hydrate | `src/store/settingsStore.ts:23-28`, `index.html:2` | Tema `night` tersimpan: paint pertama `leather` selama **63-70 ms** (t=56→126 ms di `/`, t=29→92 ms di `/dashboard`) → satu frame tema salah terlihat | **P1** | S |
| C-6 | 5 font (155 KB) diunduh di `/`; hanya 2 yang di-preload sehingga 3 lainnya masuk jalur kritis tanpa peringatan | `index.html:17-18`, `src/styles/fonts.css:26-49` | `/` mengunduh caveat 46.7 + jetbrains 19.2 + cormorant 17.8 + inter 39.4 + playfair 31.9 = **155 KB**. Kelimanya memang dipakai di cover (`CoverQuote` font-hand, `CoverDate` font-mono, `CoverTitle` font-sub, plus display/body), jadi bukan byte sia-sia — tapi 3 tidak di-preload dan `font-display: swap` membuat teks cover berganti font setelah muat. Pilih: preload 3 sisanya, atau subset/ganti yang paling dekoratif | **P2** | S |
| C-7 | Tidak ada prefetch chunk rute berikutnya; semua route `lazy()` tanpa `import()` hangat | `src/app/router.tsx:7-14` | `/dashboard` memicu **20 request JS**; `/write` **24 request** dengan WriteRoute 388 KiB chunk baru. Tidak ada `<link rel=prefetch>`/`modulepreload` di luar entry dan react | **P2** | S |
| C-8 | 3 dependency mati ikut `node_modules` (tidak masuk bundle, tapi ikut install/CI) | `package.json:24,25,31` | `zod` 4.6 MB + `react-hook-form` 1.8 MB + `@hookform/resolvers` 1.5 MB = **7.9 MB** di disk; grep bundle: 0 hit. `@tiptap/extension-character-count` 91 KB juga 0 hit | **P2** | S |
| C-9 | DiceBear dipanggil runtime dari CDN; `/settings` menembak 8 request SVG | `src/constants/avatar.ts:5,22`, `src/components/ui/Avatar.tsx:41-49` | `/dashboard` 1 request, `/settings` **8 request** ke `api.dicebear.com` (satu per seed choice). Origin ketiga di render path, di luar cache app | **P2** | S |

Catatan: C-8 bukan bundle bloat (0 byte di `dist`), jadi P2 dan bukan "file tidak terpakai yang ikut ter-bundle".

## Output mentah

### Build + ukuran chunk

```
$ npm run build 2>&1 | tail -12
dist/assets/index-BxrW52Z5.css           38.10 kB │ gzip:   7.85 kB
dist/assets/motion-DuiF-pYf.js          114.37 kB │ gzip:  37.76 kB
dist/assets/index--fBU1PhP.js           116.65 kB │ gzip:  40.38 kB
dist/assets/index.es-DuVE0rTX.js        150.88 kB │ gzip:  51.63 kB
dist/assets/html2canvas.esm-CBrSDip1.js 201.42 kB │ gzip:  48.03 kB
dist/assets/react-DLfCZ_PM.js           207.49 kB │ gzip:  67.58 kB
dist/assets/index-CPaXMYbI.js           227.80 kB │ gzip:  59.26 kB
dist/assets/jspdf.es.min-BXFNYuO_.js    390.52 kB │ gzip: 128.83 kB
dist/assets/WriteRoute-Bn88EQYW.js      396.77 kB │ gzip: 124.16 kB
dist/assets/Stats-BCJPIRfg.js           428.22 kB │ gzip: 116.79 kB
✓ built in 1m 14s

$ du -sh dist/assets/* | sort -h | tail -8
116K  dist/assets/index--fBU1PhP.js
148K  dist/assets/index.es-DuVE0rTX.js
200K  dist/assets/html2canvas.esm-CBrSDip1.js
204K  dist/assets/react-DLfCZ_PM.js
224K  dist/assets/index-CPaXMYbI.js
384K  dist/assets/jspdf.es.min-BXFNYuO_.js
392K  dist/assets/WriteRoute-Bn88EQYW.js
420K  dist/assets/Stats-BCJPIRfg.js

$ grep -rn "import(" src/ | wc -l
13
$ grep -rn "React.memo\|useMemo\|useCallback" src/ | wc -l
66
```

### Boot payload (entry + static closure, gzip)

```
BOOT: index--fBU1PhP.js + react-DLfCZ_PM.js = 316.5 KiB raw / 105.3 KiB gzip
```

### Per-route JS (gzip, static closure; supabase/jspdf/html2canvas/canvg are dynamic and excluded)

```
ROUTE        own(gz)   extra(gz)   total(gz)   heaviest chunks
/                2.6       2.9     110.9   Landing 2.6 | quotes 2.3 | IconBase.es 0.4
/dashboard      11.1      62.6     179.0   motion 36.8 | Dashboard 11.1 | AppLayout 11.0
/write         121.1      58.1     284.5   WriteRoute 121.1 | motion 36.8 | AppLayout 11.0
/reader          6.9      61.5     173.7   motion 36.8 | AppLayout 11.0 | Reader 6.9
/calendar        2.6      23.1     131.0   AppLayout 11.0 | Calendar 2.6 | quotes 2.3
/stats         113.8      19.0     238.1   Stats 113.8 | AppLayout 11.0 | quotes 2.3
/settings        5.4      54.6     165.4   motion 36.8 | AppLayout 11.0 | Settings 5.4
```

Angka ini cocok dengan ronde 1/2 (mis. `/stats` 236.2 KB, `/calendar` 128.8 KB), jadi perbaikan lama masih terpasang. Tidak ada chunk orphan.

### Byte attribution per chunk (dari sourcemap, bukan tebakan)

```
index--fBU1PhP.js (entry, 114.0 KiB generated):
    32.2 KiB  29.2%  sonner/dist
    29.0 KiB  26.3%  dompurify/dist
    19.6 KiB  17.7%  tailwind-merge/dist
     3.5 KiB   3.2%  uuid/dist
     2.2 KiB   2.0%  APP:store/syncStore.ts

Stats-BCJPIRfg.js (418.2 KiB):
   262.9 KiB  63.0%  recharts/es6
    18.8 KiB   4.5%  react-smooth/es6
    14.6 KiB   3.5%  d3-scale/src  (+ d3-shape 13.4, decimal.js-light 12.7, d3-time-format 8.9)

WriteRoute-Bn88EQYW.js (108 modules): prosemirror-view 243.0 KiB, @tiptap/core 194.4,
    prosemirror-model 121.9, prosemirror-transform 82.7, linkifyjs 61.3, @tiptap/react 60.4

react-DLfCZ_PM.js (202.7 KiB): react-dom 126.6 KiB (62.9%), @remix-run/router 47.0 (23.4%)
AppLayout-CNIn88TR.js (41.7 KiB): @phosphor-icons/react 30.6 KiB (74.0%)
index.es-DuVE0rTX.js (canvg, 148K): core-js 141 modules — dynamic, only on jspdf+SVG path
index-CPaXMYbI.js (supabase, 224K): auth-js/realtime-js — dynamic, NOT fetched on boot
```

### Live per-route transfer (Playwright, 4x CPU; body bytes)

```
route        js bytes  css bytes  requests
/              330.9K     37.2K       14
/dashboard     546.6K     37.2K       26
/write         885.4K     37.2K       24
/reader        320.9K     37.2K       10
/calendar      399.6K     37.2K       21
/stats         799.4K     37.2K       20
/settings      503.6K     37.2K       27
```

Boot request list for `/`:

```
  207548  react-DLfCZ_PM.js
  116706  index--fBU1PhP.js
   46745  caveat-400.woff2           <- used on the cover (CoverQuote), not preloaded
   39417  inter-var.woff2           <- preloaded
   38111  index-BxrW52Z5.css
   31925  playfair-var.woff2        <- preloaded
   19165  jetbrains-mono-400.woff2  <- used on the cover (CoverDate), not preloaded
   17793  cormorant-400-italic.woff2 <- used on the cover (CoverTitle), not preloaded
    6807  quotes-BCJRoGKd.js
    6757  Landing-DFkshI_8.js
    1239  document
     643  IconBase.es-BbajQl7u.js
     536  textures/leather.svg
     431  useMediaQuery-aYQe9S8k.js
```

`supabase chunk fetched: false`, `canvg chunk fetched: false` on a boot with no signed-in account (`.env.local` does set both VITE_SUPABASE_* vars, so the chunk is built and reachable but not fetched).

### C-1: satu favorite toggle, 400 entri

```
=== 400 entries, one favorite toggle ===
  wall time           3222 ms
  JSON.parse calls    5  (3.30 MiB total, 9 ms inside parse, 3 parses > 100 KiB)
  JSON.stringify      45 calls, 1.10 MiB, 23 ms
  localStorage.setItem:
            13 B  deardiary:clock
       1153680 B  deardiary:entries
            37 B  deardiary:outbox

localStorage.getItem('deardiary:entries') during one favorite toggle: 3

each entries-key read (gap = coerce+save work between reads):
  read 1: bytes=1126 KiB, work since previous read=24 ms
  read 2: bytes=1126 KiB, work since previous read=948 ms
  read 3: bytes=1127 KiB, work since previous read=2 ms
```

JSON.parse is only 9 ms, so the cost is not parsing. Scaled measurement of the coerce path:

```
DOMPurify.sanitize x1                                3.7 ms
countWords x1                                        0.5 ms
coerce path x100 entries (sanitize + countWords)     349.8 ms
coerce path x400 entries (sanitize + countWords)     1093.2 ms
```

CPU profile of the same toggle, self time:

```
    3770 ms   51.0%  (idle)
     597 ms    8.1%  parseFromString
     509 ms    6.9%  ao @ index--fBU1PhP.js:18
     473 ms    6.4%  (program)
     260 ms    3.5%  e.sanitize @ index--fBU1PhP.js:19
     241 ms    3.3%  (anonymous) @ index--fBU1PhP.js:19
      73 ms    1.0%  (garbage collector)
```

Generated lines 19-20 of the entry chunk map to `dompurify/dist` (5469 and 177 mapping segments), confirming the sanitizer is the hot path.

### C-1b: memo(EntryCard) masih jebol

React DevTools commit hook, 200 entri, 12 kartu ter-mount, satu klik bintang:

```
hook attached: {"ok":true}

commits observed after one favorite click: 1
  commit 1: 215 components rendered
      IconBase: 33
      x: 25
      StarIcon: 13
      W: 13
      Tt: 12
      y: 12
      f: 12
      k: 12
  components rendered that take an 'entry' prop: 24
  distinct entry ids re-rendered: 12
  ids: seed-0, seed-1, seed-2, seed-3, seed-4, seed-5, seed-6, seed-7, seed-8, seed-9, seed-10, seed-11
```

24 komponen ber-prop `entry` = 12 kartu x 2 lapis fiber (memo wrapper + fungsi dalam), jadi seluruh 12 kartu dirender ulang padahal hanya `seed-0` yang berubah. Toggle-nya sendiri terbukti menulis (kontrol):

```
{
  "storedFavoritesBefore": 0,
  "storedFavoritesAfter": 1,
  "writeHappened": true,
  "labelBefore": "Add to favorites",
  "labelAfter": "Remove from favorites",
  "labelChanged": true,
  "updatedAtChanged": true
}
```

### C-2: search cache

```
400 entries, filter by a term that matches every entry:
search A (cold cache)                          worst   179 ms  total   236 ms
search B (warm cache, same objects)            worst    64 ms  total    64 ms
search C (after one favorite toggle)           worst   153 ms  total   153 ms
```

### C-3: write page

```
--- write page: typing 20 characters into the editor (40 ms apart) ---
  entries=0    97.0 ms/keystroke wall, 369 ms worst long task, 1049 ms total long tasks
  entries=400  107.7 ms/keystroke wall, 235 ms worst long task, 1007 ms total long tasks
```

`97.0`/`107.7` ms per keystroke is wall time including the 40 ms harness sleep; the real
main-thread block is the long-task column: ~1000 ms over 20 keystrokes ≈ **50 ms per
keystroke**. Flat between 0 and 400 entries, so it is the editor's own per-update work.

### C-4: /stats

```
--- /stats mount at 400 entries ---
  long tasks: 128, 237, 74, 99, 1354 ms  => total 1892 ms, worst 1354 ms
  (reload path) chart present after 1124 ms, single task t=1214 dur=843 ms

attribution of the compute alone (4x CPU):
  parseDate x400 (one pass)                        1.9 ms
  toDateKey x400 (one pass, with new Date)         2.2 ms
  computeStats-shaped 10 passes over 400          26.5 ms
```

### C-5: theme flash

```
=== reload / with stored theme=night ===
  final data-theme: night
  t=   56 ms  theme -> leather   (readyState:interactive)
  t=  126 ms  theme -> night     (poll)

=== reload /dashboard with stored theme=night ===
  final data-theme: night
  t=   29 ms  theme -> leather   (readyState:interactive)
  t=   92 ms  theme -> night     (poll)
```

### C-9: DiceBear

```
[C] /dashboard: 1 DiceBear request(s)
      https://api.dicebear.com/9.x/lorelei/svg?seed=willow
[C] /settings: 8 DiceBear request(s)
      .../seed=willow, harbor, ember, ... (one per AVATAR_SEED_CHOICES entry)
```

## Yang sudah beres (jangan dikerjakan ulang)

Diverifikasi masih terpasang, sesuai `reports/perf/99-final.md` dan `99-final-round2.md`:

- jspdf + html2canvas tetap dynamic-only; `/stats` dan `/settings` tidak mengunduhnya (`canvg chunk fetched: false`).
- Framer Motion tetap keluar dari boot dan dari `/`: `/` = 110.9 KB total vs `/dashboard` 179.0 KB (motion 36.8 KB hanya di rute yang membukanya).
- `sideEffects` array, dynamic import supabase dari `client.ts`, font self-hosted, tanpa date-fns — semuanya sengaja, tidak dilaporkan sebagai bug.
- Virtualisasi: `react-window` `FixedSizeGrid` dipakai di `src/components/entry/EntryList.tsx` dengan `LIMITS.virtualizeThreshold = 100`; 400 entri merender 12 kartu, jadi list besar tidak masalah.
- Font self-hosted memang keputusan yang benar (tidak ada origin ketiga di jalur render); yang tersisa di C-6 hanya soal mana yang di-preload, bukan soal self-hosting.

**Yang diklaim beres ronde 2 tapi ternyata belum:**

- `memo(EntryCard)` (R-1 di `99-final-round2.md`). Probe dengan React DevTools commit hook menunjukkan 12/12 kartu tetap dirender ulang saat satu bintang diklik — lihat C-1b. Ronde 2 memperbaiki identitas callback, tapi identitas objek `entry` masih berubah tiap read karena `coerceEntry`, jadi `memo` tetap tidak skip. DOM node memang di-reuse React, dan itu bukan bukti memo bekerja.

## Handoff

Prioritas berdasarkan angka, bukan ukuran diff:

1. **C-1 (P0)** — akar masalah: `coerceEntry` di jalur baca. Tiga opsi, dari termurah: (a) cache hasil coerce per objek mentah dengan `WeakMap`, sehingga read kedua dan seterusnya pada record yang sama tidak men-sanitize ulang; (b) pindahkan `sanitizeEntryHtml` dari `coerceEntry` ke `needsRepair` saja, karena `looksUnsafe` sudah menjadi pre-check murah; (c) simpan `wordCount` yang sudah ada dan jangan hitung ulang bila record tidak berubah. Ini satu perubahan di `entryFields.ts` + `entryQuery.ts` dan menghapus ~1.1 s per write pada 400 entri. Perbaikan (a)/(b) sekaligus menutup **C-1b**, karena objek `entry` kembali stabil dan `memo(EntryCard)` akhirnya bisa skip.
2. **C-3 (P1)** — editor: hitung kata di luar `onUpdate` (debounce) atau pakai `editor.storage.characterCount`; autosave signature jangan `JSON.stringify` seluruh deps tiap render. Target: hilangkan ~50 ms blocked per ketikan.
3. **C-4 (P1)** — `/stats`: `computeStats` sudah dibungkus `useMemo` dan `isAnimationActive={false}` sudah dipasang di chart; yang tersisa adalah biaya mount recharts (262.9 KiB komponen). Reproduksi beban compute-nya hanya 26.5 ms, jadi hampir semua 843-1354 ms ada di render chart — perlu satu putaran ukur terpisah sebelum memilih perbaikan.
4. **C-5 (P1)** — inline script kecil di `index.html` yang membaca `deardiary:settings` dan menulis `data-theme` sebelum bundle dieksekusi. Menghapus 63-70 ms frame tema salah.
5. **C-6/C-7 (P2)** — preload juga tiga font cover (atau subset), dan tambahkan `modulepreload` untuk chunk rute yang paling mungkin berikutnya (`/dashboard` dari `/`).

Ukuran yang dipakai: `node scripts/measure-routes.mjs` untuk transfer, `node scripts/measure-perf.mjs` untuk paint. Untuk C-1/C-3/C-4, instrumen yang dipakai audit ini adalah Playwright + CDP `Profiler` + `PerformanceObserver('longtask')`; skrip sementara sudah dihapus, tidak ada file sumber yang diubah.

## Catatan

- `.env.local` di checkout ini berisi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` yang terisi, jadi build ini meng-compile jalur sync. Chunk supabase (224 KB) tetap tidak diunduh sampai ada sesi akun. Ini bukan temuan perf, hanya konteks agar angka boot tidak disalahartikan.
- Tidak ada backend/RUM/origin ketiga di jalur render selain DiceBear (C-9).
- Proyek belum di-security-audit; laporan ini murni perf dan bukan bukti clearance keamanan.
