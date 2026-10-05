# next-A — Perf sisa (verifikasi ulang setelah fix P0)

Repo: `D:\.1Kuliah\Coding\Dear dia`. Branch: `main` @ `3e37cc3`. Tanggal: 2026-10-05.
Build: `npm run build` PASS (14.65 s). Serve: `node scripts/serve-with-csp.mjs 5212`.
Metode: Playwright (global) + CDP `Emulation.setCPUThrottlingRate(4)` + `PerformanceObserver('longtask')`. Read-only.

## Ringkasan

Enam dari tujuh temuan P2 perf masih ada dan terukur ulang pada build segar. Angka lama dari `C-perf.md` sebagian besar masih berlaku karena fix P0 (coerce cache) hanya menyentuh jalur baca/write store, bukan editor (C-3), mount chart (C-4), atau bootstrap tema (C-5). Yang paling murah dan paling terasa: C-5 (satu frame tema salah, 14-73 ms) dan C-3 (~130 ms blocked per ketikan @4x). C-8 masih benar-benar 0 byte di bundle. C-6/C-7/C-9 kosmetik/low-impact.

## Tabel temuan (status SEKARANG)

| ID | Masalah | file:baris | Bukti terukur sekarang | Status | P | Effort |
|---|---|---|---|---|---|---|
| C-3 | Editor hitung `countWords`+`countCharacters` (regex penuh) tiap `onUpdate`; autosave `JSON.stringify(deps)` tiap render | `src/pages/Write/useEditorSetup.ts:52-56`, `src/hooks/useAutosave.ts:39` | 20 ketikan, 40 ms jarak, @4x CPU: **total long task 2630 ms** (entries=0) / **2685 ms** (entries=400); worst single **317 ms**; 22 long task. Flat antara 0 dan 400 entri, jadi beban editor sendiri | MASIH ADA | P2 | M |
| C-4 | `/stats` mount menghitung `computeStats` + render recharts dalam satu task | `src/pages/Stats/Stats.tsx:17`, `src/services/statsService.ts:29-56` | 400 entri @4x CPU: reload **worst 1375 ms, total 2527 ms** (6 task); nav **worst 1418 ms, total 4076 ms** (11 task). Dominan render recharts (262.9 KiB chunk) | MASIH ADA | P2 | M |
| C-5 | `data-theme` ditulis hanya dari `settingsStore.hydrate()`, tidak ada inline script pra-hydrate | `src/store/settingsStore.ts:23-28`, `index.html:2` | Tema `night` tersimpan: paint pertama `leather` pada t=14-16 ms, `night` baru pada t=56 ms (`/`) dan t=73 ms (`/dashboard`) -> 1 frame tema salah. Reproduksi `requestAnimationFrame` sampling dari first paint | MASIH ADA | P2 | S |
| C-6 | 3 font (caveat, jetbrains-mono, cormorant) tidak di-preload padahal dipakai di cover | `index.html:17-18` | `/` mengunduh 5 font; hanya playfair + inter di-preload. Ukuran: caveat 46.7 KB, jetbrains 19.2 KB, cormorant 17.8 KB = 83.7 KB tanpa preload, `font-display: swap` -> teks cover berganti font setelah muat | MASIH ADA | P2 | S |
| C-7 | Tidak ada prefetch/modulepreload rute berikutnya | `src/app/router.tsx:7-14` | `grep prefetch/modulepreload index.html router.tsx` -> kosong. `/dashboard` 19 request JS, `/write` 16 request JS (fresh build) | MASIH ADA | P2 | S |
| C-8 | 4 dependency mati: zod, react-hook-form, @hookform/resolvers, @tiptap/extension-character-count | `package.json:24,25,31` | Disk: zod 4.6M + react-hook-form 1.8M + @hookform/resolvers 1.5M = **7.9 MB**; character-count 91K. `grep zod/react-hook-form/@hookform src/` -> **0 hit**; `grep` bundle -> 0 hit | MASIH ADA | P2 | S |
| C-9 | DiceBear dipanggil runtime dari CDN; `/settings` menembak 8 request SVG | `src/constants/avatar.ts:5,22`, `src/components/ui/Avatar.tsx:41-49` | `/dashboard` 1 request, `/settings` **8 request** ke `api.dicebear.com` (satu per AVATAR_SEED_CHOICES) | MASIH ADA | P2 | S |

## Output mentah

```
=== C-3 write page typing (real keys) @4x CPU ===
entries=0    wall=3563ms  worst=317ms  totalLongTasks=2630ms  count=22
             tasks=[206,317,115,161,158,158,144,135,85,85,100,141,97,96,92,78,88,61,100,85,63,65]
entries=400  wall=3568ms  worst=301ms  totalLongTasks=2685ms  count=22
             tasks=[193,301,94,168,205,199,141,135,123,96,85,124,114,68,77,77,97,77,76,83,77,75]

=== C-4 /stats mount @4x CPU, 400 entries ===
reload  worst=1375ms  total=2527ms  count=6   tasks=[132,68,665,234,53,1375]
nav     worst=1418ms  total=4076ms  count=11  tasks=[697,320,76,305,369,209,277,215,66,124,1418]

=== C-5 theme flash (stored night), first-paint sampling ===
/           first=16ms:leather  leatherAt=16ms  nightAt=56ms  final=night
/dashboard  first=14ms:leather  leatherAt=14ms  nightAt=73ms  final=night

=== C-6 fonts / C-7 requests (fresh build, networkidle) ===
/          js=6   total=14  fonts=[playfair-var, inter-var, jetbrains-mono-400, cormorant-400-italic, caveat-400]
/dashboard  js=19  total=26  fonts=[playfair-var, inter-var, cormorant-400-italic, caveat-400]
/write     js=16  total=25  fonts=[playfair-var, inter-var, cormorant-400-italic, jetbrains-mono-400, caveat-400]

=== C-8 dependency disk ===
zod: 4.6M   react-hook-form: 1.8M   @hookform/resolvers: 1.5M   @tiptap/extension-character-count: 91K
grep zod|react-hook-form|@hookform in src/: none

=== C-9 DiceBear requests ===
/dashboard  dicebear=1
/settings   dicebear=8

$ npm run build 2>&1 | tail -4
dist/assets/index-C1rt0RKa.js           118.07 kB │ gzip:  40.91 kB
dist/assets/WriteRoute-BjPts52F.js      398.06 kB │ gzip: 124.54 kB
dist/assets/Stats-yp2HcMUi.js           428.22 kB │ gzip: 116.79 kB
✓ built in 14.65s
```

## Penilaian dampak (bukan ukuran diff)

1. **C-5 (S, terasa langsung)** — 1 frame tema salah tiap load untuk pengguna tema night/paper. Fix = inline script 4 baris di `index.html` sebelum bundle. Tidak menyentuh batas baris (bukan file src). Prioritas tertinggi dari sisi rasio dampak/effort.
2. **C-3 (M, terasa saat menulis)** — ~130 ms blocked per ketikan @4x. Akar: `measure()` di `onUpdate` menjalankan `countWords` + `countCharacters` (regex atas seluruh body) tiap update. Fix: hitung di luar `onUpdate` (debounce) atau pakai panjang karakter editor.
3. **C-8 (S, tidak terasa runtime)** — 7.9 MB disk/CI saja, 0 byte bundle. Hapus aman bila build + suite tetap hijau.
4. **C-4/C-6/C-7/C-9 (P2, kosmetik/low)** — C-4 dominan render recharts (perlu ganti chart lib untuk menurunkan, mahal); C-6/C-7 satu baris masing-masing; C-9 origin ketiga di render path (butuh keputusan produk: bundel avatar atau terima CDN).

## Handoff

- Kerjakan C-5 dan C-3 di Wave B1 (terbukti masih ada, murah). C-8 hapus dependency hanya bila build + semua suite hijau.
- C-4/C-6/C-7/C-9: rekomendasi saja (lihat laporan utama). C-4 butuh keputusan ganti chart library; jangan dikerjakan tanpa persetujuan.

## Risiko & rollback

- C-5: inline script harus membaca key yang sama (`deardiary:settings`, field `theme`) dan toleran JSON rusak (try/catch). Rollback = hapus blok script.
- C-3: mengubah frekuensi pengukuran kata; pastikan penghitung di UI tetap benar. Rollback = kembalikan `measure()` di `onUpdate`.
- C-8: `npm i` ulang mengembalikan. Risiko = ada impor tak terdeteksi grep (mis. string dinamis) -> build/tsc akan gagal, jadi aman.
