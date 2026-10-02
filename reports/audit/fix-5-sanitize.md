# Fix 5 — Sanitizer (A-01, A-02, B-06)

Branch: `fix/repo-audit` · Tanggal: 2026-10-02 · Agent: FIX-5
Scope: `src/lib/sanitize.ts`, `reports/apply/swarm-prompt-pack.md`, `reports/audit/A-security.md`, `reports/audit/F-tests-docs.md`

## Ringkasan

Ketiga temuan diperbaiki dan diverifikasi di Chromium nyata (bukan stub).

- **A-01 (P1) — FIXED.** `target` dan `rel` sekarang bertahan; `rel` paksa `noopener noreferrer` kembali berjalan (bukan dead code). `javascript:` dan `data:text/html` tetap diblokir.
- **A-02 (P2) — FIXED.** Project ref dan satu fragmen anon key di-redaksi dari semua file tracked di `reports/`. `grep` bersih.
- **B-06 (P2) — FIXED.** `looksUnsafe('<p>money = 20</p>')` sekarang `false`. Penulisan ulang storage turun dari **6 dari 6** page load menjadi **0 dari 6**.

`src/lib/sanitize.ts` naik 67 → 88 baris (batas 200; aman). Tidak ada pelemahan sanitasi: 20 vektor XSS diuji ulang, semua netral.

## Perubahan

### A-01 — `src/lib/sanitize.ts:38-41`, `:57-62`

Dipilih **Opsi A** (batasi regex URI ke atribut URI lewat opsi DOMPurify yang tepat), bukan Opsi B.

Alasan memilih A:

1. **Opsi B menghapus pengerasan yang disengaja.** Default DOMPurify (`IS_ALLOWED_URI`) mengizinkan `ftp`, `ftps`, `callto`, `sms`, `cid`, `xmpp` **dan** URL protocol-relative (`//evil.com`) lewat cabang `[^a-z]`. Regex kustom sengaja lebih ketat. Menghapusnya berarti membuka `//evil.com` — regresi keamanan, bukan perbaikan.
2. **Opsi A menutup akar masalah, bukan gejalanya.** Akarnya: `_isValidAttribute` di DOMPurify menjalankan `IS_ALLOWED_URI` terhadap **setiap** atribut yang tidak ada di `URI_SAFE_ATTRIBUTES` (`node_modules/dompurify/dist/purify.es.mjs:2081-2082`). Opsi A mendeklarasikan `target`/`rel` sebagai URI-safe, jadi hanya atribut URI sungguhan (`href`, `src`) yang menghadapi regex — persis seperti yang dimaksud komentar lama.
3. **Opsi A lebih kecil dari Opsi C.** Tidak perlu sanitasi atribut manual; satu opsi DOMPurify sudah cukup. Nama opsi diverifikasi dari tipe terpasang, bukan ditebak: `ADD_URI_SAFE_ATTR?: string[]` di `node_modules/dompurify/dist/purify.es.d.mts:26`, dan implementasinya `_resolveSetOption(cfg, "ADD_URI_SAFE_ATTR", ...)` di `purify.es.mjs:1311` — **union** dengan default, jadi tidak menghapus entri bawaan.

Kode:

```ts
const ALLOWED_URI_REGEXP = /^(?:https?|mailto|tel|data:image\/)/i;

/** `target` and `rel` hold non-URL values, so they are exempt from `ALLOWED_URI_REGEXP`. */
const URI_SAFE_ATTR = ['target', 'rel'];
```

```ts
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP,
    ADD_URI_SAFE_ATTR: URI_SAFE_ATTR,
  });
```

Blok pemaksa `rel` di `:63-65` tidak diubah: sekarang benar-benar mencapai tagnya dan terbukti berjalan (lihat probe). Regex itu sendiri punya kerapuhan yang sudah dicatat di A-security (raw `>` di nilai atribut sebelumnya) — tidak diperbaiki karena tidak reachable setelah DOMPurify men-serialize `>` menjadi `&gt;`, dan memperbaikinya bukan bagian dari fix ini.

### B-06 — `src/lib/sanitize.ts:83-88`

Regex diubah dari:

```ts
/<\s*(script|iframe|object|embed|style|svg|math|form)\b|on[a-z]+\s*=|javascript:|data:text\/html/i
```

menjadi:

```ts
/<\s*(script|iframe|object|embed|style|svg|math|form)\b|<[a-z][a-z0-9]*[^>]*[\s"'/]on[a-z]{2,}\s*=|javascript:|data:text\/html/i
```

Dua perubahan, keduanya mempersempit:

1. Cabang `on[a-z]+\s*=` sekarang menuntut **tag di depannya** (`<[a-z][a-z0-9]*[^>]*[\s"'/]on...`), jadi `money =`, `one=`, `season =` di teks biasa tidak cocok.
2. `on[a-z]+` menjadi `on[a-z]{2,}`: kata berakhiran "on" dua huruf (`one`) tidak mungkin cocok, sementara setiap handler HTML nyata (`onclick`, `onerror`, `onmouseover`, ...) minimal 2 huruf setelah `on`. Daftar handler nyata diekstrak dari Chromium dan semua tercakup.

**Tradeoff yang dipilih: false negative lebih diutamakan daripada penulisan ulang storage.** Regex ini bukan pertahanan — `sanitizeEntryHtml` (DOMPurify) yang menjadi pertahanan, dan `coerceEntry` tetap membersihkan di boundary. Jadi handler yang lolos dari pre-check tetap dibersihkan oleh sanitizer; yang terjadi hanyalah jalur repair tidak dijalankan untuk record itu. Kebalikannya (false positive) menyebabkan seluruh key `entries` ditulis ulang setiap page load — biaya nyata pada setiap load. Karena itu pre-check dibuat lebih longgar dan sanitizer tetap ketat.

Satu residual false positive dicatat jujur: `<a title="x onclick=alert(1)">y</a>` masih `true`, karena regex tidak bisa membedakan `on...=` di dalam nilai atribut dari atribut sungguhan. Dampaknya nol — nilainya inert (hanya teks di `title`), sanitizer membiarkannya, dan sebelum fix pun kasus ini sudah `true`. Tidak ada regresi.

### A-02 — redaksi

| File | Baris | Perubahan |
|---|---|---|
| `reports/apply/swarm-prompt-pack.md` | 6, 16, 173 | `<project-ref>` → `<project-ref>` |
| `reports/audit/A-security.md` | 15, 29, 203-209, 213, 215 | ref → `<project-ref>`; fragmen anon key → `<anon-key>` |
| `reports/audit/F-tests-docs.md` | 173 | `sb_publishable_...` → `sb_publishable_<anon-key>` |

Arti instruksi tidak berubah: placeholder tetap jelas menunjukkan ke mana nilai asli harus diisi. Dua file laporan (`A-security.md`, `F-tests-docs.md`) di luar daftar scope awal juga di-redaksi karena memuat rahasia yang sama — itu justru tujuan perintah "cek juga file lain di reports/".

## Output mentah — SEBELUM

Probe dijalankan di Chromium nyata (Playwright Chromium 1243, Chrome/153.0.8010.12) terhadap Vite dev server yang menyajikan `src/lib/sanitize.ts` asli. Bukan stub `check-sync-harness.mjs`. DOMPurify 3.4.16.

```
$ (import /src/lib/sanitize.ts) sanitizeEntryHtml:
"<a href=\"https://x\" target=\"_blank\" rel=\"noopener noreferrer\">y</a>"
  -> "<a href=\"https://x\">y</a>"
"<a href=\"javascript:alert(1)\">x</a>"
  -> "<a>x</a>"
"<img src=\"data:image/png;base64,AAA\">"
  -> "<img src=\"data:image/png;base64,AAA\">"
"<a href=\"https://x\" target=\"_blank\">y</a>"
  -> "<a href=\"https://x\">y</a>"
"<a href=\"data:text/html,<script>alert(1)</script>\">z</a>"
  -> "<a>z</a>"

looksUnsafe:
"<p>money = 20</p>"        -> true     <-- B-06 false positive
"<p>season = winter</p>"   -> false
"<p>one=1</p>"             -> true     <-- B-06 false positive
"<p>onclick=alert(1)</p>"  -> true
"<img src=x onerror=alert(1)>" -> true
```

`target` dan `rel` hilang dari setiap link (A-01). `needsRepair` selalu `true` untuk entri berisi `money =` (B-06) → `listAllRecords` menulis ulang key `entries` setiap load.

## Output mentah — SESUDAH

```
$ (import /src/lib/sanitize.ts) sanitizeEntryHtml:
"<a href=\"https://x\" target=\"_blank\" rel=\"noopener noreferrer\">y</a>"
  -> "<a href=\"https://x\" target=\"_blank\" rel=\"noopener noreferrer\">y</a>"
"<a href=\"javascript:alert(1)\">x</a>"
  -> "<a>x</a>"
"<img src=\"data:image/png;base64,AAA\">"
  -> "<img src=\"data:image/png;base64,AAA\">"
"<a href=\"https://x\" target=\"_blank\">y</a>"
  -> "<a href=\"https://x\" target=\"_blank\" rel=\"noopener noreferrer\">y</a>"
"<a href=\"data:text/html,<script>alert(1)</script>\">z</a>"
  -> "<a>z</a>"

looksUnsafe:
"<p>money = 20</p>"        -> false
"<p>one=1</p>"             -> false
"<p>season = winter</p>"   -> false
"<img src=x onerror=alert(1)>" -> true
"<p onclick=\"x\">c</p>"   -> true
```

Sweep vektor XSS (20 kasus) setelah fix — semua netral:

```
"<script>alert(1)</script>"                          -> ""
"<img src=x onerror=alert(1)>"                       -> "<img>"
"<svg onload=alert(1)>"                              -> ""
"<iframe src=\"javascript:alert(1)\">"               -> ""
"<a href=\"JaVaScRiPt:alert(1)\">x</a>"              -> "<a>x</a>"
"<a href=\"java\tscript:alert(1)\">x</a>"            -> "<a>x</a>"
"<a href=\" javascript:alert(1)\">x</a>"             -> "<a>x</a>"
"<a href=\"data:text/html;base64,PHNjcmlwdD4...\">x</a>" -> "<a>x</a>"
"<form action=\"x\"><input></form>"                  -> ""
"<style>body{}</style>"                              -> ""
"<object data=\"x\"></object>"                       -> ""
"<math><mtext><img src=x onerror=alert(1)></mtext></math>" -> ""
"<a href=\"https://x\" onclick=\"alert(1)\" target=\"_blank\">x</a>"
  -> "<a href=\"https://x\" target=\"_blank\" rel=\"noopener noreferrer\">x</a>"
"<a href=\"vbscript:msgbox(1)\">x</a>"              -> "<a>x</a>"
"<a href=\"//evil.com\">x</a>"                       -> "<a>x</a>"
"<a href=\"https://x\" rel=\"opener\" target=\"_blank\">x</a>"
  -> "<a href=\"https://x\" rel=\"noopener noreferrer\" target=\"_blank\">x</a>"
"<img src=\"https://x/y.png\" alt=\"a\" title=\"b\">" -> "<img src=\"https://x/y.png\" alt=\"a\" title=\"b\">"
"<a href=\"tel:+1\" target=\"_blank\">t</a>"          -> "<a href=\"tel:+1\" target=\"_blank\" rel=\"noopener noreferrer\">t</a>"
"<a href=\"mailto:a@b.c\" target=\"_blank\">m</a>"    -> "<a href=\"mailto:a@b.c\" target=\"_blank\" rel=\"noopener noreferrer\">m</a>"
```

Catatan penting: `rel="opener"` sekarang **ditimpa** menjadi `noopener noreferrer` — kontrol yang sebelumnya dead code terbukti aktif. `//evil.com` tetap diblokir (Opsi B tidak diambil justru karena ini).

Verifikasi end-to-end lewat jalur app (seed localStorage → buka `/entry/e2e-link` → baca DOM):

```
$ anchors di reader:
{"href":"https://example.com","target":"_blank","rel":"noopener noreferrer",
 "outer":"<a href=\"https://example.com\" target=\"_blank\" rel=\"noopener noreferrer\">link</a>"}
{"href":null,"target":null,"rel":null,"outer":"<a>bad</a>"}

$ storedContent:
"<p>see <a href=\"https://example.com\" target=\"_blank\" rel=\"noopener noreferrer\">link</a> and <a>bad</a></p>"
```

Link aman mempertahankan `target` + mendapat `rel`; link `javascript:` kehilangan `href` di jalur baca maupun di storage.

Efek B-06 pada penulisan storage (seed 1 entri berisi `money = 20`, hitung `setItem` ke key `entries` selama 6 pemanggilan `listAllRecords`):

```
$ sesudah: {"key":"deardiary:entries","writesPerLoad":[0,0,0,0,0,0],"totalWrites":0}
```

Sebelumnya terukur 6 dari 6. Sekarang 0 dari 6.

Layer service (`needsRepair` / `coerceEntry`) setelah fix:

```
{"looksUnsafe_plainMoney":false,"needsRepair_plainMoney":false,
 "needsRepair_plainOne":false,"needsRepair_imgOnerror":true,
 "needsRepair_jsLink":true,"needsRepair_goodLink":false,
 "coerceEntry_goodLink":"<a href=\"https://x\" target=\"_blank\" rel=\"noopener noreferrer\">y</a>",
 "coerceEntry_jsLink":"<a>x</a>",
 "coerceEntry_plainMoney":"<p>I spent money = 20 today.</p>"}
```

## Output mentah — grep rahasia

```
$ grep -rn "<project-ref>" reports/ README.md .env.example || echo "no project ref left"
no project ref left

$ grep -rn "lbvQGM2YAk9qL44v66kJ2A" reports/ README.md .env.example || echo "no anon key left"
no anon key left in reports/README/.env.example
```

Catatan: nilai asli tetap ada di **git history** (commit `e88a853`) — redaksi hanya menyentuh working tree. Ref/anon key tidak bisa dihapus dari history tanpa rewrite, dan itu di luar scope. Anon key aman by design (publik + RLS), project ref bernilai rendah; tidak perlu rewrite history.

## Output mentah — gate

```
$ npm run typecheck 2>&1 | tail -3
npm notice run deardiary@1.0.0 typecheck
npm notice run tsc --noEmit --pretty false
EXIT=0

$ npm run lint:emoji 2>&1 | tail -3
npm notice run deardiary@1.0.0 lint:emoji
npm notice run eslint src --ext .ts,.tsx
EXIT=0

$ wc -l src/lib/sanitize.ts
88 src/lib/sanitize.ts

$ node scripts/check-sync-storage.mjs 2>&1 | tail -2
PASS  every service file is within 120 lines — all within limit
ALL PASS
EXIT=0

$ node scripts/check-sync-merge.mjs 2>&1 | tail -2
PASS  the real merge matches the oracle on the re-stamped tie cases — 1 cases agree
ALL PASS
EXIT=0

$ node scripts/check-sync-harness.mjs 2>&1 | tail -2
PASS  oracle agrees with the real merge on a two-sided case
ALL PASS
EXIT=0

$ node scripts/check-sync-race.mjs 2>&1 | tail -2
PASS  the pass reports the whole batch as pushed — 2
ALL PASS
EXIT=0

$ node scripts/check-csp-parity.mjs 2>&1 | tail -2
PASS  script-src does not carry 'unsafe-inline' — script-src 'self'
ALL PASS
EXIT=0
```

`scripts/check-sanitize.mjs` belum ada (scope agent lain) — tidak dibuat, sesuai instruksi.

## Handoff

1. **A-03 (P2, belum dikerjakan — sesuai instruksi).** `vite` 5.4.21 punya 3 advisory, satu HIGH. Fix butuh Vite 8 (major, breaking). Hanya dev server, tidak masuk bundle produksi. Relevan karena development di Windows.
2. **A-04 (P2).** `@tiptap/*` 2.27.3 prototype pollution, tidak ada patch di jalur 2.x; fix butuh migrasi ke 3.31.4. Tidak reachable di app ini.
3. **A-05 / A-06 (P2).** `react-router` 6.30.6 dan `uuid` 9.0.1 rentan pada jalur yang tidak dipakai app ini. Tidak eksploitatif.
4. **A-07 (P2).** `images[]` dari backup/pull tidak divalidasi sebagai URL di `src/services/entryFields.ts:93-95`. Belum ada sink yang me-render-nya; kalau nanti dirender, nilai ini melewati allowlist sanitizer.
5. **A-08 / A-10 (P2).** Migrasi tidak menulis `grant` eksplisit; `auth.uid()` tidak dibungkus `(select ...)`. Fail-closed / performa saja.
6. **B-06 residual.** `<a title="x onclick=alert(1)">` masih memicu `looksUnsafe` (inert, dampak nol, bukan regresi). Kalau suatu saat mau presisi penuh, ganti pre-check dengan parse DOMPurify — tapi itu menghapus alasan pre-check ini ada (murah).
7. **Regex pemaksa `rel`** (`sanitize.ts:63`) masih rapuh terhadap `>` mentah di nilai atribut sebelumnya; tidak reachable setelah serialisasi DOMPurify. Tidak disentuh.
8. **Git history** masih memuat project ref dan anon key. Redaksi hanya di working tree.
