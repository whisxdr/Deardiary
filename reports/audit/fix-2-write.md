# Fix 2 — Write path (B-01, B-02, B-03, B-09 instance)

Branch: `fix/repo-audit` · Tanggal: 2026-10-02 · Agent: FIX-2
Scope: `src/pages/Write/**`, `src/services/entryWrite.ts`. Tidak ada file lain yang diubah. Tidak ada `git`, tidak ada `npm run build` (build bukti ke `/tmp`, lihat catatan).

## Ringkasan

| ID | Status | Ringkas |
|----|--------|---------|
| B-01 (P1) | FIXED | `coerceDraft` memvalidasi bentuk draft saat dibaca; `tags` non-array tidak lagi mematikan composer |
| B-02 (P1) | FIXED | Clamp `LIMITS` di jalur tulis (`draftPayload`, `createEntry`, `updateEntry`) + `maxLength` location + penghitung karakter di editor (mulai 90%) |
| B-03 (P1) | FIXED | Publish entri baru menghapus draft milik composer ini (ref `wroteDraft`), draft sesi lain tetap aman |
| B-09 (P2) | FIXED (instance) | `useEditorSetup.ts` 102 → 92 baris; sweep seluruh `src/pages/Write` bersih |

Bukti mentah sebelum → sesudah ada di bawah. Semua suite: `check-composer` ALL PASS (16/16) di build segar, `npm test` 9/9 script hijau (exit 0), `npm run typecheck` bersih.

## Perubahan (file:baris + alasan)

### B-01 — `src/pages/Write/draftStart.ts` (57 → 95 baris)

- `:40-70` fungsi baru `coerceDraft(stored: Partial<StoredDraft>): StoredDraft`. Setiap field jatuh sendiri-sendiri ke default (`emptyDraft()`), jadi satu nilai rusak tidak membuang seluruh draft. `tags` non-array menjadi `[]`; string tag difilter lalu masuk `sanitizeTags` yang sudah ada; `mood` dicek lewat `MOODS`; `date`/`updatedAt` harus parseable; `isFavorite`/`isPrivate` harus boolean. Unknown keys dibuang.
- `:86` `initialDraft` sekarang `return coerceDraft(stored)` menggantikan `{ ...emptyDraft(), ...stored }` mentah.
- Content sengaja TIDAK dipotong di sini: draft lama yang kelewat panjang tetap tampil di editor supaya penghitung karakter (B-02) bisa memperingatkan sebelum jalur tulis memotongnya. Memotong di load akan menjatuhkan ekor tanpa satu pun petunjuk di layar.
- Tidak memakai `coerceEntry` dari `entryFields.ts` (di luar scope, dan itu untuk `Entry` penuh — butuh `id`/`createdAt`/sanitasi HTML yang tidak dimiliki draft).

### B-02 — clamp di tiga titik tulis, satu sumber batas

- `src/pages/Write/writeDraft.ts:73-87` — `draftPayload` memotong `content` ke `LIMITS.contentMaxLength` dan `location` ke `LIMITS.locationMaxLength`. Ini satu-satunya titik yang dilewati autosave DAN publish, jadi clamp di sini menutup keduanya.
- `src/services/entryWrite.ts:11-33` — `createEntry` memotong `content` dan `location` juga (defense in depth: store/import path memanggil service langsung, tidak lewat `draftPayload`).
- `src/services/entryWrite.ts:38-56` — `updateEntry` memotong `patch.content`/`patch.location` dengan fallback ke nilai lama bila field tidak dikirim.
- `src/pages/Write/SidebarDetails.tsx:35` — `maxLength={LIMITS.locationMaxLength}` pada input location (sebelumnya user bisa mengetik 200, disk menyimpan 200, reader menampilkan 120).
- `src/pages/Write/useEditorSetup.ts` + `WriteEditor.tsx:44-56` — `contentLength` (panjang HTML mentah, persis string yang di-clamp jalur tulis) diekspos dari hook; `WriteEditor` menampilkan peringatan `aria-live` saat >= 90% batas, dan pesan berbeda saat sudah melewati batas. Tanpa dependency baru; memakai `LIMITS` dan string length, bukan `@tiptap/extension-character-count`.
- Batas tetap SATU sumber (`src/constants/limits.ts`), tidak ada angka ajaib baru.

### B-03 — `src/pages/Write/useWriteActions.ts` + sibling baru `draftOwnership.ts`

- `draftOwnership.ts` (baru, 19 baris) — `clearSpentDraft(start, wroteDraft)`: hapus key draft bila `wroteDraft` true (composer ini pernah menulis draft di jalur autosave/flush) ATAU `resumesDraft(...)` true (composer ini me-resume draft). Selain itu tidak menyentuh apa pun — draft sesi lain tetap aman.
- `useWriteActions.ts:29-30` — ref `wroteDraft`, di-set di `persist` (`:59-62`) pada setiap penulisan draft, termasuk saat hanya fallback in-memory yang menerimanya (draft tetap terbaca dari sana, jadi publish tetap harus menghabiskannya).
- `useWriteActions.ts:83-89` — publish entri baru memanggil `clearSpentDraft` HANYA bila write entri benar-benar mencapai storage (`!lastWriteFailed`). Kalau quota menolak write entri, draft tidak dihapus — kalau tidak, catatan user tidak ada di mana pun selain memori.
- `published.current` dipertahankan: mencegah flush `pagehide` menulis draft setelah publish.
- Alasan memilih ref, bukan sekadar `resumesDraft`: alur bug adalah "New entry → autosave 5 dtk → Publish", di mana `resumesDraft` false; ref menandai kepemilikan draft dengan benar.

### B-09 — `useEditorSetup.ts` 102 → 92 baris

- Effect "load stored body" dipindah ke sibling baru `src/pages/Write/useStoredContent.ts` (38 baris) dengan komentar keputusan utuh (guard per-instance StrictMode, `addToHistory: false`).
- `useEditorSetup.ts` juga kehilangan `AppliedContent`/`appliedRef` (pindah ke sibling) dan mendapat `measure` + `contentLength` untuk B-02.

### File lain

- `src/pages/Write/Write.tsx:29,59` — meneruskan `contentLength` dari hook ke `WriteEditor`.
- `src/pages/Write/WriteEditor.tsx:9,16-22,44-56` — prop `contentLength` + blok feedback batas.

## Bukti mentah

### 1. Sebelum — check-composer + typecheck (repo `dist/`, 5212)

```
$ node scripts/check-composer.mjs 2>&1 | tail -8
PASS  Missing entry shows the not-found state — editor=false
PASS  Publishing clears the resumed draft
PASS  Leaving mid-edit saves the pending change — " first note. Appended while editing.</p>"
PASS  Stale tab reports the conflict — "\n    Skip to contentDearDiaryEvery page is your storyEntriesCalendarStatsWrite a"
PASS  Stale tab does not overwrite the other tab — "<p>Written by the other tab.</p>"
PASS  no console errors

ALL PASS

$ npm run typecheck 2>&1 | tail -3
npm notice run deardiary@1.0.0 typecheck
npm notice run tsc --noEmit --pretty false
```

### 2. Sebelum — probe B-01 (draft `tags: "oops"`)

```
$ BASE_URL=http://localhost:5212 node /tmp/fix2-b01.mjs
body: "\n    This page lost its bookmarkSomething went wrong while rendering. Your entries are still safe in local storage.Something went wrong whil"
editor present: false, title: null
FAIL: malformed draft took the composer down
exit=1
```

### 3. Sebelum — probe B-03 (publish entri baru setelah autosave)

```
$ BASE_URL=http://localhost:5212 node /tmp/fix2-b03.mjs
draft after autosave: "NEW NOTE"
after publish: draft="{\"title\":\"NEW NOTE\",\"content\":\"<p>Body of the new no entries=1 url=/entry/544c7da4-2426-40b9-8af3-8126623c2c51
FAIL: draft survived publishing a new entry
exit=1
```

### 4. Sebelum — probe B-02 (tempel 25.000 karakter + location 200)

```
$ BASE_URL=http://localhost:5212 node /tmp/fix2-b02b.mjs
limit feedback: absent
location field holds 200 characters
stored content length: 25007
stored location length: 200
exit=0
```

### 5. Sebelum — probe B-02 node (snapshot `writeDraft.ts` pra-fix vs modul asli)

```
$ node /tmp/fix2-b02-node.mjs
BEFORE snapshot: content=25000 location=200 (clamp 20000/120 -> FAIL)
AFTER real module: content=20000 location=120 (clamp 20000/120 -> PASS)
PASS
```

### 6. Sesudah — check-composer + typecheck

Catatan kejujuran: repo `dist/` dibangun 11:55 (sebelum perbaikan) dan tugas ini melarang `npm run build`, jadi suite dijalankan terhadap build segar di `/tmp` yang disajikan server CSP di port 5213 (pola yang sama dipakai FIX-4: `npx vite build --outDir <tmp>`; `dist/` repo tidak disentuh). Build bukti terakhir dibuat 13:33 dan memuat seluruh isi tree saat itu, termasuk perubahan file di luar scope yang ditulis agent paralel (`src/services/entryQuery.ts` 13:16, `package.json` 12:40) — bukan perubahan FIX-2.

```
$ npx vite build --outDir /tmp/fix2-dist2 --emptyOutDir
✓ built in 35.61s

$ BASE_URL=http://localhost:5213 node scripts/check-composer.mjs 2>&1 | tail -20
PASS  Save draft writes the draft key — "First note"
PASS  New entry opens an empty title — ""
PASS  New entry opens an empty body — ""
PASS  Landing offers Continue Writing while a draft exists
PASS  Continue Writing restores the draft title — "First note"
PASS  Continue Writing restores the draft body — "Body of the first note."
PASS  Publish navigates to the reader — /entry/608af9a0-402f-4bfa-a736-d7bec857cd67
PASS  Editing an entry loads its body — "Body of the first note."
PASS  New entry from an edited entry clears the body — ""
PASS  New entry from an edited entry clears the title — ""
PASS  Missing entry shows the not-found state — editor=false
PASS  Publishing clears the resumed draft
PASS  Leaving mid-edit saves the pending change — " first note. Appended while editing.</p>"
PASS  Stale tab reports the conflict — "\n    Skip to contentDearDiaryEvery page is your storyEntriesCalendarStatsWrite a"
PASS  Stale tab does not overwrite the other tab — "<p>Written by the other tab.</p>"
PASS  no console errors

ALL PASS

$ npm run typecheck 2>&1 | tail -3
npm notice run deardiary@1.0.0 typecheck
npm notice run tsc --noEmit --pretty false
```

Semua 16 assertion PASS. `npm test` juga dijalankan: 9/9 script hijau, exit 0 (8 suite mencetak `ALL PASS`; `check-week-bucket.mjs` mencetak baris `PASS` per-assertion dan exit 0).

### 7. Sesudah — probe B-01

```
$ BASE_URL=http://localhost:5213 node /tmp/fix2-b01.mjs
body: "\n    Skip to contentDearDiaryEvery page is your storyEntriesCalendarStatsWrite an entryEntry titley1 word1 characters1 min readDetailsDate &"
editor present: true, title: "x"
PASS: composer survived the malformed draft
```

### 8. Sesudah — probe B-03 + guard draft sesi lain

```
$ BASE_URL=http://localhost:5213 node /tmp/fix2-b03.mjs
draft after autosave: "NEW NOTE"
after publish: draft=null entries=1 url=/entry/1abd9cf2-e89b-49c3-a258-4e821e00bf25
PASS: publish cleared the draft

$ node /tmp/fix2-b03-guard.mjs
after publish: entries=1 draft title="OTHER SESSION"
PASS: another session draft survived
```

### 9. Sesudah — probe B-02 (browser + node + service)

```
$ BASE_URL=http://localhost:5213 node /tmp/fix2-b02b.mjs
limit feedback: "Over the character limit — the end of this entry will be cut when it is saved."
location field holds 120 characters
stored content length: 20004
stored location length: 120

$ node /tmp/fix2-b02-service.mjs
createEntry: content=20000 location=120
updateEntry: content=20000 location=120
PASS
```

`stored content length: 20004` = 19.996 karakter teks + tag penutup yang ditambahkan DOMPurify saat dibaca (`<p>...</p>`), persis sama dengan yang dihasilkan jalur baca `coerceEntry` (`entryFields.ts:73-74`) — bukan sisa pemotongan. Location berhenti di 120 karena field sekarang menolak ketikan ke-121.

### 10. Sesudah — sweep batas baris

```
$ find src/pages/Write -name '*.ts*' | xargs wc -l | awk '$1>100 && $2!="total"'
(empty)

$ wc -l src/services/entryWrite.ts
120 src/services/entryWrite.ts
```

`useEditorSetup.ts` final: 92 baris. `useWriteActions.ts`: 100. `Write.tsx`: 100. `entryWrite.ts`: 120 (batas services). Tidak ada file `src/` yang melebihi batasnya; satu-satunya file >150 di `src/` adalah `src/store/syncStore.ts` (197) yang sudah ada sebelumnya dan di luar scope.

## Handoff — temuan yang TIDAK diperbaiki

| ID | Alasan tidak diperbaiki |
|----|-------------------------|
| B-04 | Import menimpa entri lokal lebih baru. Perbaikannya di `src/pages/Settings/sections/DataSection.tsx` + `importService.ts` — di luar scope FIX-2. Butuh desain konfirmasi (dialog baru), bukan sekadar clamp. |
| B-05 | Toast sukses padahal write gagal ("Clear all entries", import). `DataSection.tsx` di luar scope. Pola perbaikannya sudah tersedia (`reportWrite` di `saveError.ts` mengikuti hasil write), tinggal dipakai di sana. |
| B-08 | Tidak ada perubahan terpisah: kedua resep B-08 (clamp jalur tulis + `maxLength` location + penghitung di editor) justru sudah menjadi bagian wajib dari perbaikan B-02 di atas. Substansinya selesai; tidak ada kerja tambahan yang tersisa kecuali `CharacterCount` Tiptap yang dilarang (dependency, di luar scope). |
| B-09 | Instance yang ditemukan audit (`useEditorSetup.ts` 102 baris) diperbaiki karena aturan keras tugas mewajibkannya ≤100. Sweep penuh mengonfirmasi tidak ada pelanggaran batas lain di `src/pages/Write`; `src/store/syncStore.ts` (197) di luar scope. |
| B-12 | `DataSection` menghitung `estimateUsage()` hanya saat `entries.length` berubah. File di luar scope. |

Temuan P2 lain di `B-correctness.md` (B-06, B-07, B-10, B-11) juga tidak disentuh: B-06 sudah diperbaiki FIX-5; B-07 adalah perilaku draft yang disengaja; B-10/B-11 bukan bug yang perlu tindakan di scope ini.

## Catatan implementasi

- Semua invariant dipertahankan: flush `pagehide` tetap sinkron (tidak ada `await` baru di jalur tulis), tombstone delete tidak disentuh, guard `expectedUpdatedAt` tidak diubah, sanitasi boundary `coerceEntry` tidak disentuh, `nextStamp()` tetap satu-satunya sumber stamp.
- File baru hanya sibling di `src/pages/Write/`: `draftOwnership.ts` (19 baris) dan `useStoredContent.ts` (38 baris).
- Probe browser sementara ada di `/tmp` (`fix2-b01.mjs`, `fix2-b02b.mjs`, `fix2-b02-node.mjs`, `fix2-b02-service.mjs`, `fix2-b03.mjs`, `fix2-b03-guard.mjs`, snapshot pra-fix di `/tmp/fix2-before/`), tidak ada di repo.
