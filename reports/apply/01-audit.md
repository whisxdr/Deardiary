# 01 — Audit data-loss / correctness (sync)

Scope: `src/services/sync/**`, `src/services/entry*.ts`, `src/services/supabase/**`, `supabase/migrations/20261001000000_entries.sql`, `src/types/entry.ts`, `src/constants/storageKeys.ts`.
Read-only. Repo: `D:\.1Kuliah\Coding\Dear dia`, branch `apply/supabase-sync`.

## Ringkasan (<=5 baris)

1. Semua 4 harness (harness/merge/race/storage) ALL PASS, tapi harness selalu meng-echo stamp PERSIS seperti yang di-mint client — round-trip format lewat server TIDAK pernah diuji.
2. **P0:** client menandai waktu dengan `toISOString()` (`Z`, 3 digit ms); server (PostgREST/`timestamptz`) mengembalikan spelling lain (`+00:00`, trailing zero dipangkas). `merge.ts` membandingkan stamp sebagai STRING mentah, jadi tiap entri yang sudah sync akan di-`bump` + di-push ULANG tiap pass, tanpa henti.
3. **P0:** guard `expectedUpdatedAt` di `entryWrite.ts:44` juga string-compare → edit user bisa di-DROP diam-diam saat spelling stamp beda (instant sama).
4. Akar sama: tidak ada normalisasi stamp/date di boundary `coerceEntry`/`safeIso`. Perbaikan satu titik (normalisasi ke `new Date(x).toISOString()`) menutup dua P0.
5. Di luar itu: tombstone, outbox clear race, RPC accepted ids, pagination `.range`, RLS, clock monotonic — semua terbukti benar.

## Tabel temuan

| ID | Masalah | file:baris | Bukti/dampak | P | Effort |
|----|---------|-----------|--------------|----|--------|
| F1 | Stamp/date tidak dinormalisasi di boundary; `merge.ts` membandingkan `updatedAt`/`date` sebagai string mentah. Client `Z`+3ms vs server `+00:00`/trim → tie tidak simetris → tiap pass menang-tie lokal, di-`bump`, di-push ulang SELAMANYA. Tie dua device jadi tidak konvergen. | `entryFields.ts:41-45` (`safeIso` return string mentah), `entryFields.ts:66-95` (`coerceEntry`), `mapper.ts:57-75` (`fromRow`), `merge.ts:24-30` (`key`), `merge.ts:43-48` (`preferred`), `merge.ts:101-110` (tie→bump), `engine.ts:53,59,88` | Repro: entry identik, instant sama, `Z` vs `+00:00` → `changed=true`, `bumped={x:...}`, `toPush=[x]`; 5 pass idle → `pushed=5`, stamp naik terus. Dampak: bandwidth/baterai, `updatedAt` melaju ke masa depan tanpa henti, server row ikut bergerak. | **P0** | S |
| F2 | Guard optimistic-concurrency `updateEntry` string-compare stamp. Bila entry di-storage memakai spelling server (`+00:00`) dan composer memegang stamp `Z` (instant sama), edit user di-return `null` = DIBUANG diam-diam. | `entryWrite.ts:44`, pemakaian `src/pages/Write/useWriteActions.ts:48,66` (`stampRef.current`) | Repro: storage `updatedAt=...+00:00`, panggil `updateEntry(id,{title},...Z)` → `null` (edit hilang). | **P0** | S |
| F3 | `SyncReport.pushed` dihitung dari `outgoing.length` (dicoba), bukan id yang diterima server. Salah laporan; id ditolak tetap ter-queue dengan benar. | `engine.ts:82` | `pushed = outgoing.length` meski `acceptedIds` lebih kecil. Kosmetik (tidak ada konsumer produksi selain test). | P2 | S |
| F4 | Harness buta terhadap normalisasi server: stub `push`/`pull` meng-echo string client apa adanya; semua fixture `.000Z`. Tidak ada satu pun test round-trip `+00:00`/trim. | `scripts/check-sync-harness.mjs:122-136` (`entry()`), `:250-260` (`stubAdapter`) | F1/F2 lolos seluruh suite padahal rusak di produksi. | P2 | S |

Catatan F1: keyakinan tinggi bahwa PostgREST mengembalikan `timestamptz` sebagai `+00:00` (bukan `Z`). Bukti: (a) PostgreSQL `to_json(timestamptz)` memang mengeluarkan `+00:00`, bukan `Z`; (b) fixture PostgREST sendiri (`test/spec/fixtures/schema.sql:3088-3090`) mendefinisikan DOMAIN `isodate` yang satu-satunya tugas adalah `replace(to_json($1)#>>'{}','+00:00','Z')` — justru untuk MEMAKSA `Z`; semua contoh `Z` di spec PostgREST berasal dari domain itu, sedangkan kolom `timestamptz` polos dirender native; (c) dokumentasi/diskusi Supabase menampilkan `created_at` sebagai `"...T00:00:00+00:00"`. Kolom di migrasi adalah `timestamptz` polos. Endpoint live tidak bisa diverifikasi (REST root balas `401 Secret API key required`). Bila ternyata server sudah mengembalikan `Z`, F1 turun jadi residual (Postgres tetap memangkas trailing zero `.100`→`.1`, memicu rewrite+churn lebih jarang), F2 tetap berlaku.

## Output perintah mentah

### node scripts/check-sync-harness.mjs
```
# sync harness self-check
PASS  sync barrel loaded
PASS  entry query loaded
PASS  entry write loaded
PASS  oracle agrees with the real merge on a two-sided case
ALL PASS
```

### node scripts/check-sync-merge.mjs
```
PASS  downloading marks the collection changed
PASS  newer local copy wins
PASS  winning local copy is pushed
PASS  newer remote copy wins
PASS  losing local copy is not pushed
PASS  remote win marks the collection changed
PASS  identical copies are not marked changed
PASS  identical copies are not re-uploaded
PASS  newer local deletion wins
PASS  deletion is pushed so the other device drops it
PASS  newer remote deletion wins
PASS  remote deletion is not pushed back
PASS  a remote tombstone is adopted locally
PASS  the union still holds the untouched entry
PASS  an edit newer than a delete wins
PASS  the resurrecting edit is pushed
PASS  union keeps every id from both sides — l1,l2,shared,r1,r2
PASS  every id appears exactly once
PASS  first device to sign in downloads the second device's entries
PASS  first device does not delete anything
PASS  an exact tie picks the same winner on both devices — <p>ZZZ</p> vs <p>ZZZ</p>
PASS  the tie winner is not left undecided
PASS  the losing side queues a push
PASS  a title-only tie converges
PASS  a differing mood on an equal stamp still triggers a push or a write — changed=true toPush=0
PASS  a field-only tie picks the same mood on both devices — sad vs sad
PASS  the tie winner is re-stamped strictly past the shared stamp — 2026-09-20T00:00:00.000Z
PASS  the bumped winner is queued for upload
PASS  the bump is reported for the outbox
PASS  the settle stamp is the bumped one
PASS  the losing device does not bump
PASS  the losing device settles the stamp it considered
PASS  the remote copy wins the tie — <p>zzz</p>
PASS  the settle stamp is the local stamp that was considered — 2026-09-21T00:00:00.000Z
PASS  a remote win is not queued for upload
PASS  no field difference is silently ignored — all covered
PASS  a deletedAt-only difference on an equal stamp is not ignored — changed=true toPush=0
PASS  the real merge matches the oracle on every case above — 24 cases agree
PASS  the real merge matches the oracle on the re-stamped tie cases — 1 cases agree
ALL PASS
```

### node scripts/check-sync-race.mjs
```
# sync races
PASS  a stale-stamp clear leaves the newer change queued — {"a":"stamp-new"}
PASS  a matching-stamp clear removes the change — {}
PASS  an unrelated queued change is untouched
PASS  the local write is stored while the pull is pending — 5bca52b4-5ebd-4d98-bc8f-103ef9478bed,baseline
PASS  the write made during the pull is not erased by the write-back — 5bca52b4-5ebd-4d98-bc8f-103ef9478bed,baseline,from-server
PASS  the baseline entry survives — 5bca52b4-5ebd-4d98-bc8f-103ef9478bed,baseline,from-server
PASS  the server's entry arrives — 5bca52b4-5ebd-4d98-bc8f-103ef9478bed,baseline,from-server
PASS  nothing was lost — 5bca52b4-5ebd-4d98-bc8f-103ef9478bed,baseline,from-server
PASS  the entry queued before the pass was uploaded — owned
PASS  a write made during the push is still queued afterwards — {"a4d6da8b-4001-41d0-b349-475e257cd2cf":"2026-10-01T16:20:22.016Z"}
PASS  the write made during the push is not lost — a4d6da8b-4001-41d0-b349-475e257cd2cf,owned,remote
PASS  the pass reports the failure — The server could not be reached.
PASS  the queued change is kept for a retry — {"retry":"2026-09-01T00:00:00.000Z"}
PASS  the entry itself is untouched — retry
PASS  a failed pull is reported
PASS  a failed pull leaves the collection intact — safe
PASS  the queue drains after the concurrent passes — {}
PASS  the queue signature is empty
PASS  re-editing one id changes the signature — one:v1 -> one:v2
PASS  the signature is order-independent
PASS  a later write gets a strictly later stamp — 2026-10-01T16:20:22.017Z -> 2026-10-01T16:20:22.018Z
PASS  a write after pulling a future stamp lands after it — 2030-01-01T00:00:00.000Z -> 2030-01-01T00:00:00.001Z
PASS  the remote winner is stored — <p>new</p>
PASS  the losing local copy is cleared from the queue — {}
PASS  the late edit is stored during the push
PASS  the late edit stays queued instead of being cleared by the remote win — {"x":"2026-10-01T16:20:22.019Z","y":"2026-09-01T00:00:00.000Z"}
PASS  the late edit is not lost
PASS  the local tie winner is kept — sad
PASS  the tie winner is re-stamped past the shared stamp — 2026-10-01T16:20:22.019Z
PASS  the re-stamped winner is uploaded — tie
PASS  the tie drains the queue — {}
PASS  the queue signature is empty
PASS  the RPC returns the accepted ids — returns setof text
PASS  the RPC returns the accepted rows
PASS  the stale-write guard is still present
PASS  the pull uses .range pagination — .range
PASS  the pull loops until a short page ends the walk
PASS  the pull no longer caps at a single .limit(1000)
ALL PASS
```

### node scripts/check-sync-storage.mjs
```
PASS  clear all keeps the records for sync
PASS  clear all queues every tombstone — {"a":"2026-10-01T16:20:24.296Z","b":"2026-10-01T16:20:24.296Z"}
PASS  an existing tombstone keeps its original stamp — 2026-01-01T00:00:00.000Z
PASS  a pulled tombstone is written to storage — shared(tomb)
PASS  a pulled tombstone hides the entry
PASS  the first account claims the device — alice-id
PASS  the adopted entries are kept — alice-note
PASS  a different account is detected as foreign
PASS  the same account is not foreign
PASS  the foreign owner is read back — alice-id
PASS  the previous account's entries are dropped — none
PASS  the previous account's queue is dropped — {}
PASS  the device is claimed for the new account — bob-id
PASS  nothing is pending upload after the switch
PASS  offline entries are adopted on first sign-in — written-before-signup
PASS  the device is claimed
PASS  clearLocalEntries empties the collection — none
PASS  clearLocalEntries empties the queue — {}
PASS  the queue is written to storage — {"persist":"2026-10-01T16:20:24.296Z"}
PASS  the queue stamp matches the tombstone stamp
PASS  the tombstone keeps the id — secret
PASS  the tombstone keeps the deleted stamp — 2026-10-01T16:20:24.297Z
PASS  the tombstone keeps a valid updated stamp — 2026-10-01T16:20:24.297Z
PASS  the deleted body is scrubbed — ""
PASS  the deleted title is scrubbed — ""
PASS  the deleted tags are scrubbed — []
PASS  the deleted location is scrubbed
PASS  the deleted images are scrubbed
PASS  no plaintext of the deleted entry remains in storage
PASS  every tombstone body is scrubbed — |
PASS  no cleared plaintext remains
PASS  an older live record in the import does not resurrect the deleted entry — gone(tomb)
PASS  the deleted entry stays hidden after the import
PASS  a newer explicit record restores the entry — revive
PASS  the restored entry is visible
PASS  an equal-stamp import does not restore a deleted entry — same(tomb)
PASS  the import replaces a live entry — from import
PASS  the import adds a new entry
PASS  every service file is within 120 lines — all within limit
ALL PASS
```

### node scripts/check-sync-removed.mjs (browser suite; 4 FAIL karena `.env.local` berisi kredensial — DI LUAR scope)
```
PASS  the tombstone is not shown as a visible entry
PASS  the live entries are untouched — live=2
PASS  a deleted entry is kept as a tombstone — gone-1(tomb), kept-1
PASS  the deleted entry is gone from the visible list
PASS  the tombstone survives an unrelated write — 854c3264-d460-418d-8f42-70b841ba4eb9, gone-1(tomb), kept-1
PASS  the unrelated write is stored
PASS  clear all writes tombstones for every entry — a(tomb), b(tomb)
PASS  clear all leaves nothing visible
FAIL  no Account entry in the settings nav — Entries, Calendar, Stats, Profile, Appearance, Privacy, Account, Data, About
FAIL  no sign-in form rendered
FAIL  no link points at the sync section
FAIL  the privacy copy is the unconditional local-only line
PASS  no request left for a Supabase origin — none
PASS  no request left the app origin except images — ...dicebear...
PASS  /: no request left for a Supabase origin — none
PASS  /: no Supabase chunk downloaded — none
PASS  /dashboard: no request left for a Supabase origin — none
PASS  /dashboard: no Supabase chunk downloaded — none
PASS  /settings: no request left for a Supabase origin — none
PASS  /settings: no Supabase chunk downloaded — none
PASS  /stats: no request left for a Supabase origin — none
PASS  /stats: no Supabase chunk downloaded — none
PASS  the reader still renders after the re-enable
PASS  no page errors
4 FAILED
```
Catatan: 4 FAIL itu EKSPEKTASI suite "config-off" (suite memverifikasi fitur TERSEMBUNYI saat env kosong), sedangkan build di sini justru meng-ON-kan sync. Penyebab: `.env.local` (ter-gitignore, ditulis `scripts/activate-supabase.mjs`) memuat `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`. Bukan cacat kode; suite ini hanya valid dijalankan pada build tanpa env. Logika `syncEnabled()`/`PrivacySection`/`Settings.tsx` sudah benar (lihat Handoff).

### grep -n "upsert_entries" -A30 supabase/migrations/20261001000000_entries.sql
```
76:create or replace function public.upsert_entries(p_rows jsonb)
77-returns setof text
78-language sql
79-security invoker
80-set search_path = public
81-as $$
82-  insert into public.entries (
83-    id, owner_id, title, content, mood, tags, entry_date, created_at, updated_at,
84-    is_favorite, is_private, location, images, word_count, reading_time, deleted_at
85-  )
86-  select
87-    r.id, r.owner_id, r.title, r.content, r.mood, r.tags, r.entry_date, r.created_at, r.updated_at,
88-    r.is_favorite, r.is_private, r.location, r.images, r.word_count, r.reading_time, r.deleted_at
89-  from jsonb_to_recordset(p_rows) as r (
90-    id text, owner_id uuid, title text, content text, mood text, tags text[],
91-    entry_date timestamptz, created_at timestamptz, updated_at timestamptz,
92-    is_favorite boolean, is_private boolean, location text, images text[],
93-    word_count integer, reading_time integer, deleted_at timestamptz
94-  )
95-  where r.owner_id = auth.uid()
96-  on conflict (owner_id, id) do update set
...
112-  where public.entries.updated_at < excluded.updated_at
114-  returning id;
115-$$;
117:revoke all on function public.upsert_entries(jsonb) from public, anon;
118:grant execute on function public.upsert_entries(jsonb) to authenticated;
```
Server membandingkan `timestamptz < timestamptz` (instant) — BENAR. Jadi push diterima; hanya perbandingan string di CLIENT yang rusak (F1).

### grep -n "range\|limit\|coerceEntry\|tombstone\|deletedAt" src/services/sync/*.ts src/services/entry*.ts src/services/supabase/*.ts
```
src/services/sync/merge.ts:26:    entry.updatedAt, entry.deletedAt ?? '', entry.title, entry.content, entry.mood, entry.date,
src/services/sync/merge.ts:39: * deletion beat an earlier edit (the write path stamps `updatedAt` with `deletedAt`). An
src/services/sync/merge.ts:53: * neither a new local nor a new remote entry is lost, and a tombstone on either side removes
src/services/supabase/adapter.ts:2:import { coerceEntry, looksLikeEntry } from '../entryFields';
src/services/supabase/adapter.ts:53:    // No owner filter: RLS limits the result to the caller's rows. PostgREST caps a single
src/services/supabase/adapter.ts:54:    // response at 1000 rows, so page with `.range` until a short page ends the walk; a pull
src/services/supabase/adapter.ts:64:        .range(from, from + PAGE - 1);
src/services/supabase/adapter.ts:74:    const entries = rows.map(fromRow).filter(looksLikeEntry).map(coerceEntry);
src/services/sync/owner.ts:17: * tombstones too: they belong to the previous owner and must not travel to the new one.
src/services/sync/clock.ts:7: * Persisted rather than recomputed from the entries: a tombstone can be the newest record
src/services/entryFields.ts:66:export function coerceEntry(raw: Partial<Entry>): Entry {
src/services/entryFields.ts:94:    ...(typeof raw.deletedAt === 'string' ? { deletedAt: raw.deletedAt } : {}),
src/services/entryQuery.ts:4:import { byNewest, coerceEntry, looksLikeEntry, needsRepair } from './entryFields';
src/services/entryQuery.ts:6:/** Reads all valid entries, including tombstones, and repairs old shapes. */
src/services/entryQuery.ts:11:  const entries = byNewest(records.map(coerceEntry));
src/services/entryQuery.ts:16: /** Active entries only; tombstones remain stored for sync. */
src/services/entryQuery.ts:18:  return listAllRecords().filter((entry) => !entry.deletedAt);
src/services/entryQuery.ts:21: /** Persists active entries and tombstones. */
src/services/entryWrite.ts:43:  if (entries[index].deletedAt !== undefined) return null;
src/services/entryWrite.ts:66:/** Marks an entry deleted, keeping it as a scrubbed tombstone so the removal can travel. */
src/services/entryWrite.ts:70:  if (index === -1 || entries[index].deletedAt !== undefined) return false;
src/services/entryWrite.ts:72:  const tombstone = scrub({ ...entries[index], deletedAt: now, updatedAt: now });
src/services/entryWrite.ts:73:  entries[index] = tombstone;
src/services/entryWrite.ts:75:  if (saved) enqueue(tombstone.id, tombstone.updatedAt);
src/services/entryWrite.ts:87:    entry.deletedAt === undefined ? scrub({ ...entry, deletedAt: now, updatedAt: now }) : entry,
src/services/entryWrite.ts:91:  if (saved) stamped.filter((entry) => entry.deletedAt === now).forEach((entry) => enqueue(entry.id, entry.updatedAt));
src/services/entryWrite.ts:105:    if (stored.deletedAt === undefined) return;
src/services/entryWrite.ts:118:  if (!entry || entry.deletedAt !== undefined) return null;
src/services/supabase/mapper.ts:46:    deleted_at: entry.deletedAt ?? null,
src/services/supabase/mapper.ts:53: * The result is a partial record on purpose: `coerceEntry` at the adapter boundary fills in
src/services/supabase/mapper.ts:73:    deletedAt: row.deleted_at ?? undefined,
```

### Bukti F1 — minimal repro (merge, instant sama, spelling beda)
```
$ node --input-type=module   # import mergeEntries dari scripts/check-sync-harness.mjs
same instant (getTime)? true
merge result:
  changed = true (identical content, identical instant — should be false)
  bumped  = {"x":"2026-10-01T09:20:22.017Z"} (should be {} — nothing differs)
  toPush  = ["x"] (should be [] — server already has it)
=> every pass re-stamps and re-pushes the SAME entry forever.
```

### Bukti F1 — differential: churn per spelling server
```
$ node --input-type=module   # syncNow + stub server yang menormalisasi stamp
server echoes "Z"      : total pushed over 5 idle passes = 1  final local stamp = 2026-10-01T16:20:22.016Z
server echoes "+00:00"  : total pushed over 5 idle passes = 5  final local stamp = 2026-10-01T16:35:09.281Z
server echoes no offset: total pushed over 5 idle passes = 5  final local stamp = 2026-10-01T16:20:22.016Z
```
(5 pass idle, konten TIDAK pernah berubah. Dengan `+00:00` server menerima tiap push → loop tak berujung; stamp lokal melaju maju terus.)

### Bukti F2 — guard edit dibuang
```
$ node --input-type=module   # entryWrite.updateEntry
updateEntry returned: null
=> null means the user edit was SILENTLY DROPPED (same instant, different spelling).
```

### Bukti format wire (PostgREST)
```
$ grep -n "isodate" /tmp/schema.sql   # test/spec/fixtures/schema.sql PostgREST
3078:CREATE DOMAIN public.isodate AS timestamp with time zone;
3088:CREATE OR REPLACE FUNCTION "json"(public.isodate) RETURNS json AS $$
3089:  SELECT to_json(replace(to_json($1)#>>'{}', '+00:00', 'Z'));
3090:$$ LANGUAGE SQL IMMUTABLE;
```
Domain `isodate` dibuat khusus untuk mengubah `+00:00` → `Z`. Artinya output native `timestamptz` polos adalah `+00:00`. Contoh `Z` di spec PostgREST (QuerySpec.hs:1784 `"2018-01-02T00:00:00Z"`) berasal dari domain ini, bukan `timestamptz` polos. Kolom di migrasi (`updated_at timestamptz`) adalah polos.

### Bukti RPC accepted-ids benar
```
$ sed -n '480,505p' /tmp/R.hs   # test/spec/Feature/Query/RpcSpec.hs PostgREST
      it "returns setof integers" $
        post "/rpc/ret_setof_integers" [json|{}|]
          `shouldRespondWith` [json|[1,2,3]|]
```
`RETURNS setof text` → JSON array of strings → `adapter.ts:47` `data as string[]` benar; `engine.ts:76-81` menandai terkirim hanya dari id yang diterima, dan id ditolak tetap ter-queue. BENAR.

## Handoff (di luar scope, JANGAN diperbaiki di sini)

- `check-sync-removed.mjs` 4 FAIL: murni karena `.env.local` (ter-gitignore) memuat kredensial Supabase, sehingga build meng-ON-kan sync. Suite itu valid hanya pada build tanpa env. Bukan cacat kode; jangan ubah `PrivacySection`/`Settings.tsx`/suite untuk "memperbaikinya".
- `src/store/syncStore.ts` 197 baris: melebihi batas 150 bila dianggap komponen, tapi ini store — tidak ada batas eksplisit yang dilanggar. Catat saja.
- `scripts/check-sync-removed.mjs:120` dst (assertion config-off) bergantung pada env; pertimbangkan gate env di runner, bukan di kode.
- Invariant lain terverifikasi TIDAK dilanggar: `package.json sideEffects` utuh; `@supabase/supabase-js` hanya `import type` + dynamic `import()` (`client.ts:20`); CSP identik antara `vercel.json`/`netlify.toml` (byte-identik) dan `scripts/serve-with-csp.mjs` (semantik sama, hanya komentar beda); tombstone delete utuh; sanitasi `coerceEntry` dipanggil di semua jalur masuk (localStorage `entryQuery.ts:11`, pull `adapter.ts:74`, import `importService.ts:34`; RPC hanya balas id → tidak perlu).

## Catatan

- **TIDAK ADA P1 di scope ini.** Ada 2 temuan P0 (F1, F2) dan 2 P2 (F3, F4).
- Akar F1 & F2 satu: stamp/date tidak dikanonikalisasi di boundary. Titik perbaikan terkecil: normalisasi di `safeIso` (`entryFields.ts:41-45`) agar `coerceEntry` mengembalikan `new Date(x).toISOString()` untuk `updatedAt`/`createdAt`/`date`/`deletedAt`. Setelah itu `key()`/`same()`/`preferred()` dan guard `entryWrite.ts:44` menjadi instan-consistent tanpa diubah.
- F1 bersifat kondisional pada format wire server (lihat catatan F1). Namun `+00:00` adalah perilaku native `timestamptz` dan dikonfirmasi oleh fixture PostgREST sendiri; residual (pemangkasan trailing zero) tetap memicu churn walau lebih jarang.
