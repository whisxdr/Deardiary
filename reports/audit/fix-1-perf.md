# FIX-1 — coerce cache on the read path (audit C, P0)

Date: 2026-10-02
Branch: `fix/repo-audit`
Scope: `src/services/entryQuery.ts` (only file changed)
Verified: 4 sync suites ALL PASS (twice), `npm run typecheck` exit 0, `npm test` ALL PASS, line-limit sweep empty.

## Ringkasan

Akar P0 adalah `listAllRecords()` men-coerce ulang seluruh koleksi pada setiap panggilan.
Perbaikannya: cache hasil coerce yang di-key pada **string mentah** di localStorage.
Storage yang tidak berubah mengembalikan array dan objek yang **sama persis**; storage
yang berubah membatalkan cache secara otomatis (kunci string berbeda = miss).

Satu file berubah, `src/services/entryQuery.ts`: 37 → 98 baris (masih di bawah 120).
`entryFields.ts` tidak disentuh (119 baris, tetap di limit). Tidak ada dependency baru.
Tidak ada barrel baru. Semua invariant (sanitasi `coerceEntry` di boundary, tombstone,
merge union-by-id, logical clock, localStorage otoritatif) dipertahankan.

Hasil terukur pada 400 entri (Node bench, stub DOMPurify yang menghitung panggilan):

| Metrik | Sebelum | Sesudah |
|---|---|---|
| Panggilan `sanitize` per 2 read berulang | 800 | 0 |
| Panggilan `sanitize` per 1 klik bintang + re-read | 1200 | 1 |
| Identitas elemen setelah read berulang | 0/400 | 400/400 |
| Identitas elemen setelah 1 toggle | 0/400 | 399/400 (hanya yang diedit baru) |
| `listEntries() === listEntries()` | false | true |
| 1 toggle + re-read, 400 entri | 240.1 ms | 4.9 ms |
| 1000x `listEntries()` cache hit | — | 0.9 mikrodetik/panggilan |

Browser (dev server, 4x CPU throttle, 400 entri, median 5 klik bintang):

| Metrik | Sebelum | Sesudah |
|---|---|---|
| Long task terburuk (median 5 klik) | **1586 ms** | **255 ms** |
| `EntryCard` benar-benar render saat 1 klik (12 kartu ter-mount) | 12/12 | 1/12 |

## Perubahan

`src/services/entryQuery.ts` — satu file.

- **`:18` cache** — `{ raw, records, live, coerced }`. `raw` adalah string mentah terakhir
  yang di-coerce; `records` seluruh koleksi hasil coerce; `live` hasil filter tombstone;
  `coerced` Set identitas untuk memutuskan record mana yang perlu di-coerce ulang saat write.
- **`:27 readRaw()`** — mengembalikan string mentah, atau `null` bila bukan salinan
  otoritatif. `null` bila localStorage tidak tersedia, atau bila `lastWriteFailed(entries)`
  true: saat itu salinan in-memory lebih baru, dan mempercayai string di disk akan
  menyembunyikan tulisan terakhir pengguna. Ini yang membuat kuota-penuh tetap benar.
- **`:42 remember()`** — menyimpan cache di bawah string mentah yang **dibaca ulang**,
  bukan string yang tadi dibaca. Jalur repair (`:59`) menulis teks baru; meng-cache di
  bawah teks lama akan membuat read berikutnya selalu miss.
- **`:51 listAllRecords()`** — jalur cepat `cache.raw === raw` mengembalikan `cache.records`.
  Jalur lambat tidak berubah: filter, coerce, repair-tulis-kembali, lalu `remember`.
  Perilaku repair (tulis balik saat `records.length !== stored.length` atau `needsRepair`)
  dipertahankan persis.
- **`:65 listEntries()`** — mengembalikan `cache.live` yang sudah difilter. Sebelumnya
  `.filter()` mengalokasi array baru **setiap** panggilan, jadi identitas array pun tidak
  stabil meski objeknya sama. Ini yang membuat `memo(EntryCard)` tetap jebol walaupun
  objeknya stabil.
- **`:79 saveEntries()`** — record yang sudah ada di cache (cek identitas di `coerced`)
  ditulis apa adanya; hanya record baru/berubah yang di-coerce. Jadi `updateEntry` yang
  mengubah 1 record hanya men-coerce 1 record, dan objek 399 lainnya tetap identik.
  Setelah write, cache di-prime dengan objek yang ditulis. Bila write gagal (kuota),
  cache di-null-kan supaya jalur in-memory fallback yang otoritatif tetap terbaca.

Kenapa priming saat write, bukan hanya cache pada read: write path menulis lewat
`saveEntries`, dan `updateEntry`/`deleteEntry` memutasi array yang dikembalikan
`listAllRecords()` secara in-place lalu memanggil `saveEntries`. Tanpa priming, re-read
setelah write akan melihat string mentah yang baru (karena `writeJson` baru saja menulis)
dan men-coerce ulang seluruh koleksi — persis 948 ms yang diukur audit pada read ke-2.
Priming membuat re-read itu hit, sehingga `store.entries` mempertahankan objek yang sama.

Tidak ada file lain yang disentuh. `entryStore.ts` tidak perlu diubah: `listEntries()`
setelah write sekarang mengembalikan objek yang sama, dan store tinggal menyimpannya.

## Angka sebelum → sesudah

### Node bench, 400 entri (stub DOMPurify menghitung panggilan; ms di luar biaya sanitizer asli)

Sebelum (mentah, `/tmp/fix1-before.txt`):

```
listAllRecords() #1 (cold)                             90.3 ms
listAllRecords() #2                                    400 sanitize calls
listAllRecords() #3                                    400 sanitize calls
listEntries() #1                                       400 sanitize calls
listEntries() #2                                       400 sanitize calls
array identity  listAllRecords() === listAllRecords()      false
element identity across 2 listEntries() (reused/total)     0/400

toggle + re-read wall time                                240.1 ms
sanitize calls during the toggle + re-read                1200
element identity reused after the toggle                  0/400
edited element is a new object                            yes

searchText x400 (cold)                                 44.6 ms
searchText x400 (warm)                                 0.4 ms
objects shared with the pre-toggle array                  0/400
searchText x400 (after one toggle)                     28.2 ms
searchText x400 (second pass)                           0.3 ms
```

Sesudah (`/tmp/fix1-final.txt`):

```
listAllRecords() #1 (cold)                             97.3 ms
listAllRecords() #2                                    0 sanitize calls
listAllRecords() #3                                    0 sanitize calls
listEntries() #1                                       0 sanitize calls
listEntries() #2                                       0 sanitize calls
array identity  listAllRecords() === listAllRecords()      true
element identity across 2 listEntries() (reused/total)     400/400

toggle + re-read wall time                                4.9 ms
sanitize calls during the toggle + re-read                1
element identity reused after the toggle                  399/400
edited element is a new object (coerced once)             true
an untouched element keeps its identity                   true
array identity after the toggle                           true
element identity after the toggle (reused/total)          400/400

searchText x400 (cold)                                 33.9 ms
searchText x400 (warm)                                  1.0 ms
objects shared with the pre-toggle array                  399/400
searchText x400 (after one toggle)                      0.6 ms
searchText x400 (second pass)                           0.1 ms
```

### Skala (Node, sesudah; `/tmp/fix1-scale-after.txt`)

```
 50 entries: toggle + re-read    0.8 ms, sanitize calls    1, objects reused 50/50
100 entries: toggle + re-read    0.6 ms, sanitize calls    1, objects reused 100/100
200 entries: toggle + re-read    0.8 ms, sanitize calls    1, objects reused 200/200
400 entries: toggle + re-read    3.7 ms, sanitize calls    1, objects reused 400/400

1000x listEntries() cache hits on 400 entries: 0.9 microseconds per call
one cold listEntries() on 401 entries (stub sanitizer): 32.4 ms
```

Biaya satu klik bintang kini konstan terhadap jumlah entri (1 coerce, bukan N).

### Browser, dev server, 4x CPU throttle, 400 entri (Playwright)

Median long task terburuk atas 5 klik bintang:

```
BEFORE  (/tmp/fix1-browser5-before.txt)
click 1: wall 2051 ms, worst long task 1859 ms, tasks 2, commits 1
click 2: wall 1766 ms, worst long task 1653 ms, tasks 1, commits 1
click 3: wall 1765 ms, worst long task 1576 ms, tasks 2, commits 1
click 4: wall 1700 ms, worst long task 1586 ms, tasks 1, commits 1
click 5: wall 2075 ms, worst long task 1451 ms, tasks 4, commits 3
worst-long-task median over 5 clicks: 1586 ms  (min 1451, max 1859)

AFTER  (/tmp/fix1-browser5-after2.txt)
click 1: wall  541 ms, worst long task  349 ms, tasks 1, commits 1
click 2: wall  412 ms, worst long task  301 ms, tasks 1, commits 1
click 3: wall  347 ms, worst long task  222 ms, tasks 1, commits 1
click 4: wall  362 ms, worst long task  255 ms, tasks 1, commits 1
click 5: wall  900 ms, worst long task  160 ms, tasks 4, commits 5
worst-long-task median over 5 clicks: 255 ms  (min 160, max 349)
```

Angka ini setara dengan pengukuran audit (1309 ms) pada mesin yang sama, dan turun ke
~255 ms. Sisa ~255 ms adalah coerce 1 record + render 1 kartu + commit React, bukan lagi
coerce 400 record.

Catatan: angka browser diambil lewat **dev server**, bukan build produksi, karena
`npm run build` tidak boleh dijalankan di scope ini (`dist` dipakai agent lain). Dev build
tidak minify dan memuat React dev (double-render di StrictMode), jadi angka AFTER sedikit
lebih tinggi dari yang akan terlihat di produksi; perbandingan before/after tetap adil
karena keduanya diukur di harness yang sama.

## Bukti wajib

### 1. Suite sync (SEBELUM)

```
$ node scripts/check-sync-stamps.mjs && node scripts/check-sync-storage.mjs && node scripts/check-sync-merge.mjs && node scripts/check-sync-race.mjs
# sync stamp spelling
...
ALL PASS
# sync storage and ownership
...
ALL PASS
# sync merge rules
...
ALL PASS
# sync races
...
ALL PASS
```

Sebelum: 12 + 56 + 43 + 44 = 155 PASS, 0 FAIL, keempat exit 0.

### 5. Suite sync (SESUDAH) + typecheck

```
$ node scripts/check-sync-stamps.mjs   -> ALL PASS, exit 0
$ node scripts/check-sync-storage.mjs  -> ALL PASS, exit 0
$ node scripts/check-sync-merge.mjs    -> ALL PASS, exit 0
$ node scripts/check-sync-race.mjs     -> ALL PASS, exit 0
```

Ringkasan PASS/FAIL:

```
== stamps ==   ALL PASS   PASS lines: 12   FAIL lines: 0
== storage ==  ALL PASS   PASS lines: 56   FAIL lines: 0
== merge ==    ALL PASS   PASS lines: 43   FAIL lines: 0
== race ==     ALL PASS   PASS lines: 44   FAIL lines: 0
```

Dijalankan dua kali berturut-turut (cache adalah state modul, jadi urutan dan run ulang
penting) — keduanya ALL PASS. `npm test` (harness + merge + race + storage + CSP parity)
juga ALL PASS.

```
$ npm run typecheck
> tsc --noEmit --pretty false
exit 0  (tidak ada error)
```

### 6. Sweep batas baris

```
$ find src/services -name '*.ts' | xargs wc -l | awk '$1>120 && $2!="total"'
(empty)
$ find src/store -name '*.ts' | xargs wc -l | awk '$1>200 && $2!="total"'
(empty)
$ find src/components -name '*.tsx' | xargs wc -l | awk '$1>150 && $2!="total"'
(empty)
$ find src/lib -name '*.ts' | xargs wc -l | awk '$1>200 && $2!="total"'
(empty)
```

File dalam scope, sesudah:

```
   98 src/services/entryQuery.ts   (limit 120)
  119 src/services/entryFields.ts  (limit 120, tidak diubah)
   22 src/lib/searchIndex.ts       (limit 50)
   78 src/store/entryStore.ts      (limit 200)
   50 src/components/entry/EntryCard/EntryCard.tsx (limit 150)
   97 src/pages/Dashboard/Dashboard.tsx            (limit 100)
```

### 7. Kebenaran (guard yang diuji di bench yang sama)

```
entry written during the failed write is visible          true   (kuota: fallback in-memory tetap otoritatif)
listEntries hides the tombstone                           true
listAllRecords still carries the tombstone                true
legacy record repaired in storage                         true   (jalur repair tetap menulis balik)
listAllRecords() again after the repair write          0 sanitize calls  (cache di-prime di bawah teks baru)
external rewrite is picked up                             true   (tulis dari tab lain terdeteksi via string mentah)
a raw write from another tab is picked up                 true
identity reused after a no-op saveEntries                 400/400
```

## Handoff

### C-1b — TERTUTUP

`memo(EntryCard)` sekarang benar-benar skip. Bukti langsung (probe render di
`EntryCard.tsx`, sementara, sudah di-revert; md5 file dikembalikan ke semula):

```
BEFORE:  EntryCard function renders 24, distinct entry ids rendered 12/12
AFTER:   EntryCard function renders 2,  distinct entry ids rendered  1/12
```

12 kartu ter-mount, 1 klik bintang: sebelumnya 12/12 kartu dirender ulang, sekarang hanya
kartu yang diklik (2 invocations = double-render dev StrictMode dari satu kartu yang sama).
Penyebabnya persis yang diperkirakan audit: `listEntries()` mengalokasi array baru dan
`coerceEntry` mengalokasi objek baru tiap read. Keduanya kini stabil.

### C-2 — TERTUTUP

WeakMap `searchText` sekarang hidup melintasi write. Bukti (Node, 400 entri):

```
objects shared with the pre-toggle array   0/400  ->  399/400
searchText x400 (after one toggle)        28.2 ms ->  0.6 ms
```

Saat write, 399 objek yang tidak berubah tetap objek yang sama, jadi entry WeakMap-nya
masih ada; hanya 1 entry (yang diedit) membangun teksnya ulang. Angka ini konsisten
dengan audit (153 ms → kembali cold) dan sekarang tinggal satu rebuild untuk satu entri.
Catatan: probe browser untuk C-2 (search A/B/C/D) terlalu noisy di dev server untuk
menjadi bukti — filter + render chart + commit mendominasi long task, jadi bukti C-2
memakai bench Node yang mengisolasi mekanismenya secara langsung.

### Tidak diperbaiki (di luar scope)

- **C-3 (P1)** — write page: `countWords`+`countCharacters` per `onUpdate`, autosave
  `JSON.stringify(deps)` tiap render. Bukan di jalur `listEntries`, tidak tersentuh.
- **C-4 (P1)** — `/stats` mount: render recharts 262.9 KiB. `computeStats` membaca
  `listEntries()` dan sekarang mendapat cache hit, jadi bagian compute-nya (26.5 ms)
  ikut membaik, tapi biaya render chart tetap. Perlu pengukuran terpisah sebelum memilih
  perbaikan.
- **C-5 (P1)** — theme flash: butuh inline script di `index.html` (di luar scope file).
- **C-6/C-7/C-9 (P2)** — preload font, prefetch chunk rute, DiceBear. Di luar scope.

### Catatan untuk agent berikutnya

- Cache adalah **state modul** di `entryQuery.ts`. Setiap fungsi publik yang mengubah
  storage entries harus lewat `saveEntries` (semua jalur saat ini sudah: `entryWrite`,
  `sync/engine`, `sync/owner`). Penulis langsung via `writeJson(STORAGE_KEYS.entries, ...)`
  di luar `entryQuery` akan membuat cache stale sampai string mentah berubah — saat ini
  tidak ada penulis seperti itu (diverifikasi dengan grep).
- `saveEntries` kini memanggil `coerceEntry` pada record yang belum dikenal. Ini
  memperkuat boundary: record yang datang dari merge/import lewat `saveEntries` tanpa
  coerce tetap tersanitasi sebelum masuk storage. Semua suite merge/race/storage tetap
  hijau, termasuk kasus tie yang membandingkan record.
  Trade-off yang disadari: record yang sudah di-coerce di boundary lain (adapter pull
  `supabase/adapter.ts:88`, `parseBackup`) tetapi belum ada di cache akan di-coerce dua
  kali saat sync/import. Biayanya terbatas pada entri yang berubah dan hanya di jalur
  background sync / aksi import sekali pakai; jalur tulis lokal yang dilaporkan audit
  (favorite, edit, create) tidak terkena karena objeknya sudah dikenal cache.
- `dist/` tidak disentuh; `npm run build` tidak dijalankan sesuai instruksi.

## File bukti (di luar repo, dihapus setelah laporan)

Script bench sementara (`/tmp/fix1-bench.mjs`, `/tmp/fix1-scale.mjs`,
`/tmp/fix1-browser.mjs`, `/tmp/fix1-browser5.mjs`, `/tmp/fix1-c1b-probe.mjs`,
`/tmp/fix1-c1b-probe2.mjs`, `/tmp/fix1-c2-probe.mjs`) dan output mentahnya dihapus
setelah laporan ini ditulis.
