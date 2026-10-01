# 10 — Fix: sync stamp spelling (instant vs string)

## Ringkasan

Stamp waktu disimpan apa adanya. Client menulis `toISOString()` (`Z`, 3 digit ms);
PostgREST membalas `timestamptz` sebagai `+00:00` dengan trailing zero dipangkas. Dua
nilai yang **instant-nya sama** tapi spelling-nya beda menjadi string yang **beda**,
sehingga merge menganggap ada perubahan tiap pass idle (churn push tanpa henti) dan guard
tulis `entryWrite.ts:44` men-DROP edit user diam-diam.

Perbaikan satu titik: `safeIso` mengembalikan bentuk kanonik `parsed.toISOString()`, bukan
string mentah. `deletedAt` ikut dinormalisasi, tapi kunci tetap hanya muncul saat string valid.

## Perubahan

`src/services/entryFields.ts`

- `safeIso` (baris 40-46): `: value` -> `: parsed.toISOString()`. Komentar menjelaskan
  instant = identitas, bukan spelling.
- `coerceEntry` (baris 76): hitung `const deletedAt = typeof raw.deletedAt === 'string' ? safeIso(raw.deletedAt, '') : '';`
- `coerceEntry` (baris 96): `...(typeof raw.deletedAt === 'string' ? { deletedAt: raw.deletedAt } : {})`
  -> `...(deletedAt ? { deletedAt } : {})`. Perilaku lama dijaga: absen/tidak valid -> kunci tidak ada.

Tidak menyentuh `merge.ts`, `entryWrite.ts`, `clock.ts`, `entryQuery.ts` (mereka benar begitu
stamp kanonik). Sanitasi boundary `coerceEntry` tidak dilepas.

`scripts/check-sync-stamps.mjs` (baru, 141 baris) — 12 assertion, impor nyata.

## Output mentah

### 1. Test sebelum fix (FAIL)

```
$ node scripts/check-sync-stamps.mjs; echo "exit=$?"
# sync stamp spelling
FAIL  updatedAt normalizes to the canonical Z spelling — 2026-10-01T16:00:00+00:00
FAIL  date normalizes to the canonical Z spelling — 2026-10-01T16:00:00+00:00
FAIL  createdAt normalizes trimmed-zero ms back to three digits — 2026-10-01T15:30:00.1+00:00
FAIL  deletedAt normalizes to the canonical Z spelling — 2026-10-01T17:00:00+00:00
FAIL  an unparsable deletedAt leaves the key absent — "not-a-date"
FAIL  same instant, different spelling is not marked changed — true
FAIL  no tie is bumped for a spelling-only difference — {"m":"2026-10-02T00:00:00.000Z"}
FAIL  nothing is queued for upload — m
FAIL  an edit whose expected stamp matches the instant is accepted, not dropped — null
FAIL  three idle passes push nothing when the stamp differs only in spelling — pushed per pass: 1,1,1
PASS  the outbox stays empty across the idle passes — {}
FAIL  the entry is unchanged locally — 2026-10-01T16:51:15.130Z
11 FAILED
exit=1
```

### 2. Test sesudah fix (PASS)

```
$ node scripts/check-sync-stamps.mjs; echo "exit=$?"
# sync stamp spelling
PASS  updatedAt normalizes to the canonical Z spelling — 2026-10-01T16:00:00.000Z
PASS  date normalizes to the canonical Z spelling — 2026-10-01T16:00:00.000Z
PASS  createdAt normalizes trimmed-zero ms back to three digits — 2026-10-01T15:30:00.100Z
PASS  deletedAt normalizes to the canonical Z spelling — 2026-10-01T17:00:00.000Z
PASS  an unparsable deletedAt leaves the key absent
PASS  same instant, different spelling is not marked changed — false
PASS  no tie is bumped for a spelling-only difference — {}
PASS  nothing is queued for upload
PASS  an edit whose expected stamp matches the instant is accepted, not dropped — "accepted"
PASS  three idle passes push nothing when the stamp differs only in spelling — pushed per pass: 0,0,0
PASS  the outbox stays empty across the idle passes — {}
PASS  the entry is unchanged locally — 2026-10-01T16:00:00.000Z
ALL PASS
exit=0
```

### 3. Regresi

```
$ node scripts/check-sync-merge.mjs && node scripts/check-sync-race.mjs && node scripts/check-sync-storage.mjs && node scripts/check-sync-harness.mjs; echo "exit=$?"
# sync merge rules ... ALL PASS
# sync races ... ALL PASS
# sync storage and ownership ... ALL PASS
# sync harness self-check ... ALL PASS
exit=0
```

(Setiap suite: `ALL PASS`. `check-sync-storage.mjs` termasuk cek "every service file is within 120 lines — all within limit".)

### 4. Typecheck

```
$ npm run typecheck; echo "exit=$?"
> deardiary@1.0.0 typecheck
> tsc --noEmit --pretty false
exit=0
```

### 5. Batas baris

```
$ wc -l src/services/entryFields.ts scripts/check-sync-stamps.mjs
  119 src/services/entryFields.ts
  141 scripts/check-sync-stamps.mjs
```

`entryFields.ts` = 119 baris, di bawah batas services 120.

## Handoff (di luar scope, JANGAN diperbaiki di sini)

- A1-F3 `src/services/sync/engine.ts:82` — `pushed = outgoing.length` melaporkan seluruh batch
  sebagai "pushed" walau RPC menolak sebagian (server hanya menerima row yang stamp-nya
  strictly newer). Angka report bisa menyesatkan UI. Prioritas P2. Perbaikan yang mungkin:
  `pushed = accepted ? accepted.length : outgoing.length`.
