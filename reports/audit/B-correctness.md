# Audit B — Correctness & Data Loss (non-sync)

Repo: `D:\.1Kuliah\Coding\Dear dia` · Branch: `fix/repo-audit` · Tanggal: 2026-10-02
Sifat: read-only terhadap kode. Satu file ditulis: laporan ini.
Scope: seluruh jalur non-sync (Write/autosave/draft, import/export/PDF, search, stats, calendar, store, storage, validate). `src/services/sync/**` dan `src/services/supabase/**` tidak diaudit ulang.

## Ringkasan

Tidak ada P0. Tiga P1: (1) draft tidak punya bentuk validasi apa pun saat dibaca — `tags` yang bukan array membuat composer crash penuh, dan draft lama yang sah tapi non-array melewati jalur yang sama; (2) `LIMITS.contentMaxLength` (20.000) hanya ditegakkan di `coerceEntry`, jadi editor bisa menyimpan 30k karakter yang dipotong diam-diam saat dibaca ulang, dan `location` disimpan 200 karakter tapi ditampilkan 120; (3) mem-publish entri baru saat autosave sudah menulis draft membuat draft itu tetap ada, sehingga "Continue Writing" menghasilkan duplikat. Sisanya P2: import menimpa entri lokal yang lebih baru tanpa konfirmasi, "Clear all entries" dan import melaporkan sukses padahal write gagal (quota), `looksUnsafe` false-positive pada teks biasa (`money = 20`) sehingga setiap load menulis ulang key entries, dan satu file melewati batas baris. Bukti probe Chromium terhadap bundle `dist/` ada di bawah.

## Tabel temuan

| ID | Masalah | file:baris | Bukti / dampak | Prio | Effort |
|----|---------|-----------|----------------|------|--------|
| B-01 | Draft tidak di-coerce saat dibaca. `initialDraft` mengembalikan `{ ...emptyDraft(), ...stored }` mentah, jadi tipe dari storage langsung masuk ke form. `tags` non-array menjalar ke `TagInput` (`tags.length`, `tags.map`) dan mematikan seluruh composer lewat ErrorBoundary. Draft yang ditulis build lama / hand-edit / key yang rusak cukup untuk memicunya. | `src/pages/Write/draftStart.ts:47-48` (`return { ...emptyDraft(), ...stored }`), konsumen: `src/components/editor/TagInput.tsx:17,31,48,53` | Probe: `deardiary:draft` = `{...,"tags":"oops",...}` → `/write?resume=true` menampilkan "This page lost its bookmark"; console: `TypeError: n.map is not a function at B1 (WriteRoute-*.js)`. Isolasi: `tags: null` dan `tags: "oops"` crash; mood/date/location/title/isFavorite yang rusak tidak (nilai itu dirender sebagai teks atau jatuh ke fallback). | P1 | S |
| B-02 | `LIMITS.contentMaxLength` dan `LIMITS.locationMaxLength` hanya ditegakkan di `coerceEntry` (jalur baca), bukan di jalur tulis. Editor Tiptap tanpa `CharacterCount`/`maxLength` menerima berapa pun; `draftPayload` mengirim mentah; hanya saat dibaca ulang isinya dipotong. User mengetik 30k karakter, menekan Publish, melihat reader menampilkan 20k — sisa 10k hilang permanen pada save berikutnya. Location: tersimpan 200 karakter, ditampilkan 120 (`entryFields.ts:92` memotong saat coerce; `SidebarDetails` tidak punya `maxLength`). | `src/constants/limits.ts:6-7`; `src/services/entryWrite.ts:16` (content mentah), `:25` (hanya images yang di-slice); `src/pages/Write/writeDraft.ts:69-80` (`draftPayload` tanpa clamp); `src/pages/Write/SidebarDetails.tsx:30-35` (tanpa `maxLength`); `src/services/entryFields.ts:73,92` | Probe: tempel 30.000 karakter → Publish → disk `content.length` = 30.007, reader menampilkan 19.997; reopen composer = 19.997; Ctrl+S berikutnya menulis 20.004. Location 200 karakter → disk 200, reader 120. Bandingkan `WriteEditor.tsx:35` yang memang memasang `maxLength={120}` pada title. | P1 | S |
| B-03 | Publish entri **baru** tidak menghapus draft kecuali composer itu sendiri yang di-resume. `removeKey(STORAGE_KEYS.draft)` dijaga `resumesDraft(...)`, jadi alur "New entry → tulis → tunggu autosave (5 dtk) → Publish" meninggalkan draft lengkap. Landing tetap menawarkan "Continue Writing"; mengkliknya membuka form terisi dan publish berikutnya membuat entri kedua (id baru) dengan isi sama. | `src/pages/Write/useWriteActions.ts:82-88` (guard `resumesDraft`), `:58-59` (autosave menulis draft untuk entri baru), `src/pages/Write/draftStart.ts:23-30`, `src/pages/Landing/Landing.tsx:34` | Probe: publish entri baru → `entries`=1, landing "Continue Writing"=true, resume title `"DUPE"`, publish kedua → `entries`=2. Draft lama dari sesi lain juga tertimpa oleh composer "New entry" apa pun setelah autosave (`draftAfter = "NEW NOTE"`), jadi tidak ada cara dua draft berdampingan. | P1 | S |
| B-04 | Import backup menimpa entri lokal yang lebih baru tanpa konfirmasi dan tanpa perbandingan stamp. `merged = [...current.filter(not imported), ...result.entries]` menang untuk file, apa pun `updatedAt`-nya. Import adalah satu-satunya jalur yang bisa memundurkan data lokal tanpa dialog. | `src/pages/Settings/sections/DataSection.tsx:36-42`; `src/services/importService.ts:34` (`list.filter(looksLikeEntry).map(coerceEntry)`) | Probe: entri lokal `updatedAt=2026-09-30` id `legacy-1`; import backup id sama `updatedAt=2024-01-01` → setelah import disk berisi `OLDER backup title / 2024-01-01`, dialog yang tampil = 0. Bandingkan `replaceEntries` yang memang menjaga tombstone (`entryWrite.ts:102-112`) — guard itu tidak mencakup entri hidup. | P2 | S |
| B-05 | "Clear all entries" melaporkan sukses meski write gagal. `deleteAllEntries()` mengembalikan boolean, `DataSection` membuang hasilnya, lalu `toast.success('All entries removed')` tanpa syarat. `refresh()` membaca ulang storage (yang masih berisi entri) tapi user sudah diberi tahu sebaliknya. | `src/pages/Settings/sections/DataSection.tsx:88-93` (`deleteAllEntries();` hasil dibuang, `toast.success`), `src/services/entryWrite.ts:83-93` (mengembalikan `saved`) | Probe dengan `Storage.prototype.setItem` yang melempar untuk key `entries`: toast = `["All entries removed"]`, disk masih `["One","Two"]`. Jalur import pun sama: toast sukses `"Imported 1 entries."` muncul padahal `replaceAll` gagal — hanya peringatan `useStorageWarning` yang menyertainya (`DataSection.tsx:39` juga membuang hasil `replaceAll`). | P2 | S |
| B-06 | `looksUnsafe` false-positive pada teks biasa yang mengandung `=` setelah kata berakhiran `on`. Regex `on[a-z]+\s*=` cocok dengan `money =`, `one=`, `season =` — konten yang benar-benar aman. Efeknya `needsRepair` selalu true, sehingga `listAllRecords` menulis ulang seluruh key `entries` pada **setiap** page load. | `src/lib/sanitize.ts:64`; konsumen `src/services/entryFields.ts:117`, `src/services/entryQuery.ts:12` | Probe: entri `<p>I spent money = 20 today.</p>` → key entries ditulis ulang pada 6 dari 6 page load (dashboard/stats/calendar), sedangkan entri bersih 0. Dampak correctness nol (sanitasi tetap benar), tapi ini write tak perlu pada tiap load, dan memperbesar jendela race tulis-baca antar tab. | P2 | S |
| B-07 | Draft yang di-autosave tidak pernah masuk ke `entries`, jadi entri yang belum di-publish tidak ikut backup dan tidak muncul di search/stats/calendar. Hanya bisa dipulihkan lewat "Continue Writing" di landing. Tidak ada jalur lain yang menampilkan draft. | `src/pages/Write/useWriteActions.ts:57-61` (draft → key draft saja), `src/pages/Landing/CoverActions.tsx:28-33` (satu-satunya pemulihan), `src/services/exportService.ts:58-67` (`exportBackup` hanya menerima `entries`) | Ini invariant yang tampak disengaja (draft = catatan belum selesai), tapi tidak ada peringatan di Data section bahwa draft tidak termasuk backup; "Export backup" di sisi lain menyertakan `settings` (`exportService.ts:64`). | P2 | S |
| B-08 | `Location` tidak punya `maxLength` di UI sementara storage memotongnya 120, dan content tidak punya penegakan di jalur tulis sama sekali (lihat B-02). Tidak ada jalur tulis mana pun yang memanggil `LIMITS.contentMaxLength`; `LIMITS.titleMaxLength` ditegakkan dua kali (UI + sanitizeTitle), tag ditegakkan tiga kali, tapi content dan location hanya di satu sisi. | `src/constants/limits.ts:6-7`; jalur tulis `src/services/entryWrite.ts:11-32` dan `:38-55` (tidak ada clamp content/location), `src/pages/Write/writeDraft.ts:69-80` | Sama dengan B-02 dari sisi "jalur mana yang melewatkan"; dipisah karena perbaikannya berbeda: B-02 perlu clamp di `draftPayload`/`createEntry`/`updateEntry`, B-08 perlu `maxLength` di `SidebarDetails` + `CharacterCount` di editor. | P2 | S |
| B-09 | Batas baris: `src/pages/Write/useEditorSetup.ts` 102 baris (batas pages 100). Tidak ada file >200. | `src/pages/Write/useEditorSetup.ts` | `wc -l` = 102. Semua direktori lain patuh. | P2 | S |
| B-10 | Dead code di jalur non-sync: `clearWriteError` (didefinisikan, tidak dipanggil), `useLocalStorage`, `useDebounce`, `useMood`, `useIsMobile`, `formatDateTime`, `formatCardDate`, `dominantMood`, `titleCase`, `sortBy`, `groupBy`, `shortId`, `searchFilterUrl`, `STORAGE_KEYS.view`, `sanitizeDateTime`, `htmlWordCount`, `isHtmlEmpty`, `plainToHtml`/`escapeHtml` (hanya dipakai internal parse.ts), dependency `@hookform/resolvers`, `react-hook-form`, `zod`, `@tiptap/extension-character-count` tidak diimpor di `src/`. | `src/store/entryStore.ts:27,77`; `src/hooks/useLocalStorage.ts`, `useDebounce.ts`, `useMood.ts`, `useMediaQuery.ts:21`; `src/lib/format.ts:18,23`; `src/utils/mood.ts:28`; `src/utils/string.ts:19,15`; `src/utils/array.ts:15,21`; `src/lib/id.ts:17`; `src/utils/url.ts:13`; `src/constants/storageKeys.ts:9`; `package.json:25,28,41,44` | Grep `src/` tanpa file definisi = 0 penggunaan. Bukan bug, tapi `clearWriteError` yang tak terpakai berarti `writeFailed` tetap true sampai ada mutasi berikutnya (tidak ada cara membersihkan setelah user mengekspor backup). | P2 | S |
| B-11 | `useAutosave` menganggap nilai saat mount sebagai "sudah tersimpan" lewat `lastSavedRef` — benar untuk halaman yang dibuka dengan data, tapi pada entri yang di-load asinkron `baseline` datang dari `useEffect` setelah store hydrate; antara mount dan hydrate, form kosong. Composer sudah punya guard (`enabled: Boolean(id) || Boolean(form.title || form.content)`) sehingga tidak menulis, dan `isMissing` mencegah form kosong disajikan untuk id yang hilang. Tidak ada bug yang saya temukan di jalur ini; dicatat sebagai invariant yang terverifikasi, bukan temuan. | `src/hooks/useAutosave.ts:43,57-61`, `src/pages/Write/useWriteForm.ts:36,57,80` | Probe: deep link `/write/<id-hilang>` menampilkan state missing tanpa editor; edit entri → load body benar; "New entry" dari entri yang sedang diedit membersihkan form (semua PASS di `check-composer.mjs`). | — | — |
| B-12 | `DataSection` menghitung `estimateUsage()` hanya ketika `entries.length` berubah. Mengubah settings atau menulis draft tidak memperbarui angka "Using about …". | `src/pages/Settings/sections/DataSection.tsx:22-25` (`useMemo(..., [entries.length])`) | `estimateUsage` memindai semua key bernamespace, jadi angka diam setelah draft/import settings. Kecil, tapi salah secara faktual di UI. | P2 | S |

## Cakupan — jalur yang diverifikasi aman

**Autosave / draft / race publish.**
- `check-composer.mjs` ALL PASS (16/16): draft ditulis, "New entry" bersih, "Continue Writing" memulihkan, publish membersihkan draft yang di-resume, edit → New entry tidak membawa body, deep link id hilang menampilkan state missing, **leaving mid-edit menyimpan perubahan**, dan **tab basi melaporkan konflik tanpa menimpa** (`useWriteActions.ts:44-56` + `stampRef`).
- Flush `pagehide` + unmount (`useSaveOnLeave.ts:17-24`) terverifikasi: edit tanpa menunggu timer lalu navigasi tetap tersimpan.
- Tombstone tidak bisa dibangkitkan oleh flush composer: probe menulis tombstone (termasuk stamp masa depan + scrub), lalu unmount flush → entri tetap `deleted`, tidak muncul di dashboard/calendar, `/write/<id>` menampilkan missing. Ini karena `updateEntry` menolak `deletedAt !== undefined` (`entryWrite.ts:43`).
- `published.current` mencegah flush menulis draft setelah publish/delete (`useWriteActions.ts:58,75,82,93`).

**Import/export/PDF.**
- Bentuk backup divalidasi: bukan array dan tanpa `entries` array → error jelas; `version` lebih baru → ditolak; JSON rusak → pesan; entri tanpa `content` difilter `looksLikeEntry`; entri tanpa id mendapat id deterministik `createIdFrom` (dua entri duplikat tanpa id menjadi **satu** — terverifikasi: import 3 entri → 2 tersimpan); id legacy non-UUID dipertahankan (kolom DB `text`, `supabase/migrations/…:14-15`).
- XSS lewat import: `<script>` di body → dibuang; `onerror` di `<img>` dibuang; judul ber-markup dirender sebagai teks (`pdfService.ts:34` `textContent`, `ReaderMetadata` React text). Probe `window.__pwned` = null; `reader innerHTML` bersih.
- PDF: `URL.revokeObjectURL` dijadwalkan 1 detik (`exportService.ts:18`); nama file membersihkan karakter ilegal + fallback non-Latin (`pdfService.ts:94-95`); `page.remove()` di `finally` (`:97`); paginasi multi-halaman terverifikasi (`check-export.mjs`: pages=3); dynamic import menahan 228 KB dari Stats/Settings (`check-pdf-export.mjs`: 0 sebelum, 2 sesudah).
- Entri kosong bisa di-publish (0 title, 0 content) dan reader menampilkan pesan "This page is blank…" (`ReaderContent.tsx:26-31`). Bukan kehilangan data, tapi tidak ada guard; `useWriteForm.ts:57` hanya menjaga **autosave**, bukan publish. (Tidak saya naikkan jadi temuan tersendiri; digabung ke B-03 sebagai konteks.)

**Search.**
- Index `WeakMap` tidak bisa basi: objek entri diganti setiap update, jadi entri hasil edit mendapat teks baru (`searchIndex.ts:13-22`). Query di-lowercase di kedua sisi (`useFilter.ts:53` + `searchIndex.ts:19`). Debuonce ada di dalam `HeaderSearch` (bukan per-keystroke di halaman).
- Filter tanggal: `NaN` dikecualikan dengan `!(time >= from)` (`useFilter.ts:64-65`), dan `to + 86_399_000` mencakup hari terakhir. URL `?q=`/`?tag=` di-encode (`utils/url.ts:8-15`) dan diikuti saat berubah (`Dashboard.tsx:44-46`).

**Stats/calendar.**
- Pembagian nol dijaga: `monthChange` (`statsService.ts:23`), `averagePerWeek` (`:50`), `averageWords` (`:51`), `computeMoodDistribution` `entries.length || 1` (`statsCharts.ts:63`), `WordCloud` `max <= 0` (`WordCloud.tsx:11`), heatmap `Math.max(1, ...)` (`statsCharts.ts:52`).
- Tanggal invalid: `safeDate` jatuh ke hari ini (`date.ts:12-15`); streak/heatmap memakai `toDateKey` yang aman; `computeActivityByHour` skip NaN (`statsCharts.ts:38`). Probe: entri `date:"not-a-date"` dan `mood:"zzz"` di dashboard/stats/calendar/reader → tidak ada crash, 0 pageerror.
- DST: `subDays`/`startOfWeek`/`endOfWeek`/`addMonths` semua dari local parts (`week.ts`, `month.ts`); `check-week-bucket.mjs` PASS.
- Entri tanpa mood: `safeMood` memaksa `DEFAULT_MOOD` di boundary baca (`entryFields.ts:51`), jadi `moodMeta` tidak pernah jatuh ke FALLBACK untuk data storage.
- Jam tinggi (logical clock) yang dimajukan setahun membuat `updatedAt` masa depan tapi `date` entri tetap dari `draft.date` (`createEntry` `draft.date ?? now`), jadi reader menampilkan tanggal yang benar; "Last edited" menunjukkan masa depan — kosmetik, dan perilaku clock itu memang disengaja untuk sync.

**Store.**
- `writeFailed` dilaporkan lewat `useStorageWarning` yang di-mount sekali di `providers.tsx:35` — terverifikasi muncul sebagai toast saat setItem dilempar. Selector store memakai referensi tunggal (`state.entries`, `state.writeFailed`), tidak ada selector yang membuat objek baru.
- `replaceAll` melaporkan kegagalan (`entryStore.ts:72`), tapi pemanggilnya membuang hasil (B-05).

**Validasi/LIMITS.**
- Tag: UI (`TagInput.tsx:17,49`), normalisasi (`validate.ts:10`), dan sanitasi saat simpan (`entryFields.ts:15` via `withDerivedFields`) — 3 lapis, konsisten.
- Title: UI `maxLength=120` (`WriteEditor.tsx:35`) + `sanitizeTitle` di `createEntry`/`updateEntry`/`coerceEntry`.
- Images: `slice(0, maxImages)` di tulis (`entryWrite.ts:25`) dan baca (`entryFields.ts:94`).
- Content/location: hanya di baca — lihat B-02/B-08.

## Output mentah

```
$ npm run typecheck 2>&1 | tail -5
npm notice run deardiary@1.0.0 typecheck
npm notice run tsc --noEmit --pretty false
exit=0            # tsc --noEmit bersih, tanpa error

$ node scripts/check-features.mjs 2>&1 | tail -20      # server CSP hidup (5212)
PASS  plain-text conversion keeps the paragraph break — "First para.\nSecond para."
PASS  reader renders the entry body
PASS  Calendar next month changes the header
PASS  Calendar panel leaves the old month behind — still shows=false
PASS  ArrowRight is inert on the missing page — http://localhost:5212/entry/missing-id -> http://localhost:5212/entry/missing-id
PASS  Dashboard honours ?tag=work
PASS  Dashboard honours a changed ?tag=travel
PASS  search box shows the typed text at once — "harbour"
PASS  search filters to the matching entry — ok
PASS  clearing search restores every entry
PASS  All-private diary says entries are hidden — "..."
PASS  All-private diary does not claim to be empty
PASS  Malformed privacy settings do not crash the dashboard — "..."
PASS  Dashboard renders entries despite bad settings
PASS  no console errors

ALL PASS

$ node scripts/check-composer.mjs 2>&1 | tail -20     # server CSP hidup (5212)
PASS  Save draft writes the draft key — "First note"
PASS  New entry opens an empty title — ""
PASS  New entry opens an empty body — ""
PASS  Landing offers Continue Writing while a draft exists
PASS  Continue Writing restores the draft title — "First note"
PASS  Continue Writing restores the draft body — "Body of the first note."
PASS  Publish navigates to the reader — /entry/00ee882e-…
PASS  Editing an entry loads its body — "Body of the first note."
PASS  New entry from an edited entry clears the body — ""
PASS  New entry from an edited entry clears the title — ""
PASS  Missing entry shows the not-found state — editor=false
PASS  Publishing clears the resumed draft
PASS  Leaving mid-edit saves the pending change — " first note. Appended while editing.</p>"
PASS  Stale tab reports the conflict — "…"
PASS  Stale tab does not overwrite the other tab — "<p>Written by the other tab.</p>"
PASS  no console errors

ALL PASS

$ node scripts/check-export.mjs 2>&1 | tail -20      # server CSP hidup (5212)
PASS  PDF export fires a download
PASS  PDF filename has no illegal characters — a-long-entry-56-review.pdf
PASS  long entry exports more than one page — pages=3
PASS  PDF has the A4 page box — no A4 MediaBox found
PASS  Ctrl+Enter navigates to the reader — /entry/1184c997-…
PASS  Ctrl+Enter did not insert a stray hard break — "<p class=\"reader-drop-cap\">Only line.</p>"
PASS  Ctrl+Enter kept the typed text — "<p class=\"reader-drop-cap\">Only line.</p>"
PASS  no console errors

ALL PASS

# Catatan: dengan server mati (kondisi awal), check-composer/check-export gagal
# `net::ERR_CONNECTION_REFUSED at http://localhost:5212/` — bukan regresi kode.
# Server dijalankan dengan `node scripts/serve-with-csp.mjs 5212` sebelum run di atas.

$ grep -rn "lastWriteFailed\|quota\|QuotaExceeded" src/ | head -20
src/\lib\storage.ts:39:export function lastWriteFailed(key: string): boolean {
src/\components\common\ErrorBoundary.tsx:56:    if (/QuotaExceeded|storage/i.test(message)) {
src/\pages\Write\saveError.ts:29: * Storage can refuse a write — a full quota, a blocked origin — and the entry then exists
src/\pages\Write\useWriteActions.ts:4:import { lastWriteFailed, removeKey, writeJson } from '@/lib/storage';
src/\pages\Write\useWriteActions.ts:51:        setSaveError(lastWriteFailed(STORAGE_KEYS.entries) ? 'storage' : null);
src/\pages\Write\useWriteActions.ts:76:      reportWrite(!lastWriteFailed(STORAGE_KEYS.entries), 'Entry updated', STORAGE_FULL);
src/\pages\Write\useWriteActions.ts:87:      reportWrite(!lastWriteFailed(STORAGE_KEYS.entries), 'Entry published', STORAGE_FULL);
src/\services\entryFields.ts:71:  // body, and an unbounded value reaches localStorage (quota) and DOMPurify (a full parse
src/\store\entryStore.ts:10:import { lastWriteFailed } from '@/lib/storage';
src/\store\entryStore.ts:17:  /** True when the last write did not reach localStorage (quota or blocked). */
src/\store\entryStore.ts:49:    set({ entries: listEntries(), writeFailed: lastWriteFailed(STORAGE_KEYS.entries) });
src/\store\entryStore.ts:55:    set({ entries: listEntries(), writeFailed: lastWriteFailed(STORAGE_KEYS.entries) });
src/\store\entryStore.ts:61:    set({ entries: listEntries(), writeFailed: lastWriteFailed(STORAGE_KEYS.entries) });
src/\store\entryStore.ts:67:    set({ entries: listEntries(), writeFailed: lastWriteFailed(STORAGE_KEYS.entries) });
```
`lastWriteFailed` dipakai di: composer (`useWriteActions` — pesan publish/update), store (4 mutasi), `useStorageWarning` (toast global). **Tidak** dipakai di `DataSection` — itulah akar B-05.

### Probe tambahan (Chromium terhadap `dist/` di 5212)

```
# B-01 draft tags rusak
tags string -> crashed: true
tags null   -> crashed: true
bad mood / bad date / location number / title null / isFavorite string -> crashed: false
console: TypeError: n.map is not a function at B1 (WriteRoute-Bn88EQYW.js:105)

# B-02 truncation
disk after publish: 30007 | reader visible: 19997 | reopened composer: 19997 | disk after reopen+save: 20004
location: disk 200 | reader 120

# B-03 draft after publishing a brand-new entry
entries after publish: 1 | landing offers Continue Writing: true
resumed title: "DUPE" | entries after second publish: 2
draft after New-entry autosave: NEW NOTE (was: OLD DRAFT)   # draft sesi lain tertimpa

# B-04 import older backup
after import of older backup: [{"t":"OLDER backup title","u":"2024-01-01T10:00:00.000Z"}]
dialogs shown during import: 0

# B-05 quota
toasts: ["All entries removed"] | disk still holds: ["One","Two"]
import toasts: ["This browser refused to save…","Imported 1 entries."] | disk holds: ["One"]

# B-06 looksUnsafe
A) flagged content -> rewritten on read: true    (key entries ditulis ulang tiap load, 6/6)
B) clean content  -> rewritten on read: false

# Import id
IMPORT count: 2 | legacy id kept non-uuid: true | dup no-id entries: 1
```

## Handoff

Prioritas perbaikan (semua S, satu file per temuan):

1. **B-01** — bungkus `initialDraft` dengan `coerceDraft` kecil (pola `coerceSettings` di `settingsService.ts:50`): `tags` array-of-string, `mood` dari `VALID_MOODS`, `date` lewat `safeIso`, `isFavorite/isPrivate` boolean. Draft adalah input eksternal seperti backup, perlakukan sama.
2. **B-02/B-08** — pilih satu sumber kebenaran untuk batas: clamp di `draftPayload` (atau `withDerivedFields`) **dan** pasang `CharacterCount` + `maxLength` di UI. Tanpa keduanya, truncation tetap senyap; dengan keduanya, user melihat counter yang sama dengan batas yang ditegakkan.
3. **B-03** — setelah `createEntry` sukses di `publish`, hapus draft hanya jika draft yang tersimpan memang milik composer ini. Cara termurah: simpan `updatedAt` draft saat dibaca di `start`, bandingkan sebelum `removeKey`; atau beri draft sebuah `id` dan hapus berdasarkan id itu.
4. **B-04** — di `handleImport`, jangan timpa entri dengan `updatedAt` lebih baru; tampilkan ConfirmDialog "N entri lokal lebih baru akan ditimpa" sebelum `replaceAll`. `replaceEntries` sudah punya perbandingan stamp untuk tombstone — pakai perbandingan yang sama untuk entri hidup.
5. **B-05** — periksa hasil `deleteAllEntries()` dan `replaceAll()`, ganti `toast.success` dengan `reportWrite(...)` pola `saveError.ts:33`. Sekalian panggil `clearWriteError` setelah export sukses kalau memang ingin memberi user jalan keluar dari banner.
6. **B-06** — perbaiki regex menjadi `\bon[a-z]{3,}\s*=` atau (lebih baik) buang pre-check dan andalkan `sanitizeEntryHtml`; `needsRepair` bisa memeriksa bentuk saja. Menghemat satu write per page load.
7. **B-09** — `useEditorSetup.ts` 102 baris: pindahkan `insertImage` atau blok `handleKeyDown` ke modul kecil, atau naikkan batas pages jadi 105 dengan catatan.

Untuk AUDIT-C/D: jangan ulangi jalur yang sudah ditandai aman di atas (composer race, tombstone vs flush, XSS import, PDF pagination, DST, pembagian nol stats). Yang belum tersentuh dan layak audit terpisah: `src/components/book/**` (animasi/`key` remount), `styles/**`, dan aksesibilitas keyboard pada `useKeyboard` vs `Modal` (keduanya memasang listener `keydown` global).
