# 13 — Fix tests (W2-TESTS)

Date: 2026-10-01
Branch: apply/supabase-sync

## Ringkasan

Tiga temuan P1 diperbaiki dalam scope yang diizinkan:

- **A3-06** — cabang retry `accepted`-ids di `engine.ts:76-81` sekarang punya tes perilaku
  (array `accepted` PARSIAL dan `accepted = []`). Perilaku kode dicatat apa adanya; `engine.ts`
  tidak diubah.
- **A3-03 / A3-02** — suite baru `scripts/check-csp-parity.mjs` meng-assert ketiga sumber CSP
  identik karakter-per-karakter dan memuat properti yang diklaim. Lulus (286 char, identik).
- **A3-11** — klaim "ALL PASS (29)" tanpa syarat di laporan perf dikoreksi menjadi bersyarat
  (hanya valid pada build tanpa env / config-off).
- **A3-13** — `npm test` ditambahkan ke `package.json` (lima suite murni).

Semua suite lulus. `sideEffects` tidak berubah. File di luar scope tidak disentuh. Tidak ada
perintah git dijalankan; `npm run build` tidak dijalankan.

## Perubahan

| File:baris | Alasan |
|---|---|
| `scripts/check-sync-race.mjs:329-372` | Tambah kasus 16 (`accepted` PARSIAL `['a']` untuk outgoing `['a','b']`) dan kasus 17 (`accepted = []`). Menutup A3-06: id yang tidak ada di `acceptedIds` harus tetap queued. |
| `scripts/check-csp-parity.mjs` (BARU) | Menutup A3-03/A3-02: baca CSP dari `vercel.json`, `netlify.toml`, `scripts/serve-with-csp.mjs`; assert identik + properti `connect-src`/`unsafe-eval`/`unsafe-inline`. |
| `package.json:19` | Tambah script `test` (A3-13). Hanya blok `scripts`; `sideEffects` dan dependencies tidak disentuh. |
| `reports/perf/supabase-sync-implementation.md:10,15,91-115` | Koreksi A3-11 + hitungan check: race 38→44, tambah baris `check-csp-parity`, dan syarat eksplisit untuk `check-sync-removed.mjs`. |

### Catatan perilaku A3-06 (dicatat apa adanya, bukan diperbaiki)

`engine.ts:76-81`: bila `accepted` adalah array, id yang TIDAK ada di `acceptedIds` di-`delete
settled[id]`, sehingga `clearUploaded(settled)` tidak menghapusnya dari outbox → id tetap queued
untuk retry. `report.pushed` di-set `outgoing.length` (seluruh batch), BUKAN jumlah yang diterima
(`engine.ts:82`). Kedua perilaku ini di-pin oleh tes baru, bukan diubah.

## Output mentah

### 1. SEBELUM — `node scripts/check-sync-race.mjs | tail -5`

```
PASS  the stale-write guard is still present
PASS  the pull uses .range pagination — .range
PASS  the pull loops until a short page ends the walk
PASS  the pull no longer caps at a single .limit(1000)
ALL PASS
```

### 2a. SESUDAH — `node scripts/check-sync-race.mjs` (tail, kasus baru)

```
PASS  the pull uses .range pagination — .range
PASS  the pull loops until a short page ends the walk
PASS  the pull no longer caps at a single .limit(1000)
PASS  the accepted id is cleared from the queue — {"b":"2026-09-01T10:00:00.000Z"}
PASS  the rejected id stays queued for a retry — {"b":"2026-09-01T10:00:00.000Z"}
PASS  the pass reports the whole batch as pushed — 2
PASS  an all-rejected push keeps both ids queued — {"a":"2026-09-01T10:00:00.000Z","b":"2026-09-01T10:00:00.000Z"}
PASS  the queue signature still lists both — a:2026-09-01T10:00:00.000Z|b:2026-09-01T10:00:00.000Z
PASS  the pass reports the whole batch as pushed — 2
ALL PASS
```

44 checks, ALL PASS.

### 2b. SESUDAH — `node scripts/check-csp-parity.mjs`

```
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
```

### 2c. SESUDAH — `npm test`

```
> deardiary@1.0.0 test
> node scripts/check-sync-harness.mjs && node scripts/check-sync-merge.mjs && node scripts/check-sync-race.mjs && node scripts/check-sync-storage.mjs && node scripts/check-csp-parity.mjs

# sync harness self-check
ALL PASS

# sync merge rules
ALL PASS

# sync races
ALL PASS

# sync storage and ownership
ALL PASS

# csp parity
ALL PASS
```

(Output penuh tiap suite terlihat di jalannya perintah; tiap suite menutup `ALL PASS`.)

### 3. Regresi — harness + merge + storage

```
# sync harness self-check
ALL PASS

# sync merge rules
ALL PASS

# sync storage and ownership
ALL PASS
```

Jumlah PASS per suite (dihitung): harness 4, merge 43, race 44, storage 56, csp-parity 9.

### 4. package.json guard

```
package.json valid
7:  "sideEffects": [
8-    "**/*.css",
9-    "**/styles/**"
10-  ],
```

`sideEffects` tidak berubah.

## Handoff — temuan TIDAK diperbaiki di sini

- **A3-04 (pagination hanya grep).** `check-sync-race.mjs:329-335` hanya grep sumber
  `adapter.ts` untuk `.range(` / `page.length < PAGE` / ketiadaan `.limit(1000)`. Itu bukan tes
  perilaku: tidak membuktikan walk benar-benar melewati batas 1000 baris. Untuk jadi perilaku
  butuh stub klien PostgREST (atau adapter dengan `range` yang dipanggil berulang) yang
  mengembalikan halaman penuh lalu halaman pendek dan meng-assert urutan panggilan + jumlah baris
  gabungan. Di luar scope file ini (butuh harness adapter baru).
- **A3-05 (RPC accepted-ids hanya grep SQL).** Kasus 14 (`check-sync-race.mjs:314-327`) hanya grep
  teks migrasi untuk `returns setof text` / `returning id` / klausa stale-write. Tidak ada RPC
  Postgres yang benar-benar dieksekusi, jadi tidak membuktikan server mengembalikan id yang
  diterima. Butuh Supabase hidup atau Postgres lokal + migrasi diterapkan. Di luar scope.
- **A3-08 (`import.meta.env` tak ada di Node).** `src/services/supabase/config.ts` memakai
  `import.meta.env` (Vite-only) sehingga tidak bisa diimpor di Node murni; karena itu suite murni
  tidak mengimpor config/adapter, dan jaminan env-not-configured diuji di suite browser
  (`check-sync-removed.mjs`) terhadap bundle hasil build. Ini sebab `check-sync-removed.mjs`
  TIDAK dimasukkan ke `npm test`: butuh build config-off + server CSP.

## Koreksi laporan perf (A3-11)

`reports/perf/supabase-sync-implementation.md` sebelumnya mengklaim `check-sync-removed.mjs`
"ALL PASS (29)" tanpa syarat. Di tree ini `dist/` dibangun dengan sync ON (`.env.local` berisi
kredensial), sehingga suite itu GAGAL 4/29. Klaim dikoreksi menjadi bersyarat: hijau HANYA pada
build tanpa env / config-off. Bagian lain laporan tidak dihapus. Hitungan race 38→44 dan baris
`check-csp-parity` ditambahkan agar tabel verifikasi akurat.
