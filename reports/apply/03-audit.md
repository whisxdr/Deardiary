# 03 — Audit test coverage + klaim palsu/lemah

Repo: `D:\.1Kuliah\Coding\Dear dia`. Branch: `apply/supabase-sync`. Fitur sync OTP + cross-device ADA di working tree, BELUM commit.
Peran: A3. READ-ONLY untuk `src/**`. Hanya menulis file laporan ini.

## Ringkasan

- 4 suite murni HIJAU (harness 4, merge 43, race 38, storage 56). `check-sync-removed` GAGAL 4/29 di tree saat ini, exit=1.
- Penyebab: `dist/` dibangun DENGAN sync ON (`.env.local` ada, isi kredensial Supabase nyata). Suite config-off butuh rebuild tanpa env; tidak ada yang mengotomasi langkah itu.
- Klaim `reports/perf/supabase-sync-implementation.md` "166 checks, all green" benar untuk 3 suite murni + build config-off, tapi TIDAK berlaku di tree ini.
- Klaim "CSP identik 3 tempat" SALAH: `serve-with-csp.mjs` tidak memuat `upgrade-insecure-requests`.
- Pagination dan RPC accepted-ids hanya diuji lewat regex pada file sumber/SQL, bukan perilaku. Cabang retry accepted-ids di engine tanpa tes sama sekali.
- Tidak ada `npm test` maupun CI; seluruh suite manual.

## Tabel temuan

| ID | Masalah | file:baris | Bukti/dampak | P | Effort |
|---|---|---|---|---|---|
| A3-01 | `check-sync-removed` GAGAL 4/29 di tree saat ini. `dist/` dibangun dengan sync ON (`.env.local` ada), jadi nav berisi "Account", form sign-in render, privacy copy bersyarat. | `scripts/check-sync-removed.mjs:170-184`; `.env.local:1-4`; `src/pages/Settings/Settings.tsx:15,60` | Output mentah: 4 FAIL, exit=1. Klaim `reports/perf/supabase-sync-implementation.md:102` "ALL PASS (29)" tak didukung di tree ini; suite hanya lulus setelah rebuild config-off yang tidak diotomasi. | P1 | S |
| A3-02 | Klaim CSP identik 3 tempat salah. `serve-with-csp.mjs` kehilangan `upgrade-insecure-requests`. | `scripts/serve-with-csp.mjs:12-24` vs `vercel.json:13` / `netlify.toml:28` | Perbandingan string: vercel===netlify true, vercel===serve **false**. `reports/apply/00-state.md:44` minta "verifikasi CSP identik 3 tempat" — hasilnya tidak identik. | P2 | S |
| A3-03 | Tidak ada suite yang memverifikasi header CSP. `serve-with-csp.mjs` hanya dipakai sebagai server; CSP-nya sendiri tak pernah di-assert. | `scripts/check-sync-removed.mjs:14`, `scripts/smoke-routes.mjs:9` | grep CSP di suite hanya di komentar. `upgrade-insecure-requests` hilang tanpa satu pun check merah. | P2 | S |
| A3-04 | Pagination pull diuji grep, bukan perilaku. | `scripts/check-sync-race.mjs:329-335`; `src/services/supabase/adapter.ts:47-62` | Assertion: regex `/\.range\(/`, `/page\.length < PAGE/`, `!/\.limit\(1000\)/` pada teks sumber. Loop paginasi rusak (mis. berhenti di halaman pertama) tetap lulus selama string ada. | P1 | M |
| A3-05 | RPC `upsert_entries` accepted-ids + stale-write guard diuji grep pada SQL, bukan eksekusi. | `scripts/check-sync-race.mjs:314-327`; `supabase/migrations/20261001000000_entries.sql:74-118` | Assertion regex `returns setof text`, `returning id`, `where ... updated_at < excluded.updated_at`. Tak ada SQL yang dijalankan; guard bisa salah logika dan tetap hijau. | P1 | M |
| A3-06 | Cabang retry accepted-ids di engine TIDAK diuji. | `src/services/sync/engine.ts:68-88` | Tidak ada stub `push` yang mengembalikan array `accepted` parsial. Perilaku inti (id ditolak tetap queued via `delete settled[id]`) tanpa tes perilaku; hanya kebetulan tercakup lewat regex SQL (A3-05). | P1 | S |
| A3-07 | Tidak ada `npm test` dan tidak ada CI. | `package.json` (scripts); `.github/workflows` absen | Seluruh suite manual. Coverage tidak ter-gate; regresi tidak ketahuan sampai dijalankan tangan. | P1 | S |
| A3-08 | Jaminan config-off tidak bisa diuji di suite murni. | `scripts/check-sync-harness.mjs:19-21` | `import.meta.env` tak ada di Node polos, jadi `syncEnabled()` hanya diuji di browser. Jaminan bergantung pada rebuild manual (lihat A3-01). | P2 | M |

Catatan tambahan (bukan temuan, konteks):
- `check-sync-storage.mjs:278-299` mencampur lint batas baris (120) ke suite perilaku. Bukan klaim palsu, hanya check non-perilaku di dalam suite.
- `activate-supabase.mjs:27,88` menulis/menghapus `.env.local` — disengaja, terdokumentasi, gitignored. Ini yang membuat `dist` config-on dan memicu A3-01.
- Tidak ada suite yang menulis file di dalam repo. `check-sync-removed.mjs:26-29` menolak origin non-lokal sebelum `localStorage.clear()`. Tidak ada polusi repo.

## Jalur kritis: yang tercakup vs tidak

| Jalur | Status | Bukti |
|---|---|---|
| Tombstone resurrect (edit lebih baru menang) | Tercakup perilaku | `check-sync-merge.mjs:85-93`; `check-sync-storage.mjs:251-258` |
| Outbox clear race (compare-and-delete) | Tercakup perilaku | `check-sync-race.mjs:40-62`, `225-282` |
| Merge tie (deterministik + re-stamp) | Tercakup perilaku | `check-sync-merge.mjs:113-197`; `check-sync-race.mjs:284-312` |
| Owner switch / foreign account | Tercakup perilaku | `check-sync-storage.mjs:128-171` |
| Pull pagination | HANYA grep | `check-sync-race.mjs:329-335` (A3-04) |
| RPC accepted-ids (retry) | HANYA grep SQL; engine tanpa tes | `check-sync-race.mjs:314-327`; `engine.ts:68-88` (A3-05, A3-06) |
| config-off (fitur tersembunyi) | Browser saja, dan GAGAL sekarang | A3-01, A3-08 |
| Round-trip live Supabase | Tidak ada (disengaja, tanpa kredensial) | `reports/perf/supabase-sync-implementation.md:178` |

## Output mentah semua suite

```
$ for s in check-sync-harness check-sync-merge check-sync-race check-sync-storage check-sync-removed; do echo "=== $s ==="; node scripts/$s.mjs; echo "exit=$?"; done

=== check-sync-harness ===

# sync harness self-check
PASS  sync barrel loaded
PASS  entry query loaded
PASS  entry write loaded
PASS  oracle agrees with the real merge on a two-sided case
ALL PASS
exit=0
=== check-sync-merge ===

# sync merge rules
PASS  local-only entry survives
PASS  local-only entry is queued for upload
PASS  remote-only entry is downloaded
PASS  remote-only entry is not re-uploaded
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
exit=0
=== check-sync-race ===

# sync races
PASS  a stale-stamp clear leaves the newer change queued — {"a":"stamp-new"}
PASS  a matching-stamp clear removes the change — {}
PASS  an unrelated queued change is untouched
PASS  the local write is stored while the pull is pending — c520129f-daee-4959-8239-3be6529bbe36,baseline
PASS  the write made during the pull is not erased by the write-back — c520129f-daee-4959-8239-3be6529bbe36,baseline,from-server
PASS  the baseline entry survives — c520129f-daee-4959-8239-3be6529bbe36,baseline,from-server
PASS  the server's entry arrives — c520129f-daee-4959-8239-3be6529bbe36,baseline,from-server
PASS  nothing was lost — c520129f-daee-4959-8239-3be6529bbe36,baseline,from-server
PASS  the entry queued before the pass was uploaded — owned
PASS  a write made during the push is still queued afterwards — {"031f1a51-e561-48cd-9139-b5bfeb352471":"2026-10-01T16:20:00.802Z"}
PASS  the write made during the push is not lost — 031f1a51-e561-48cd-9139-b5bfeb352471,owned,remote
PASS  the pass reports the failure — The server could not be reached.
PASS  the queued change is kept for a retry — {"retry":"2026-09-01T00:00:00.000Z"}
PASS  the entry itself is untouched — retry
PASS  a failed pull is reported
PASS  a failed pull leaves the collection intact — safe
PASS  the queue drains after the concurrent passes — {}
PASS  the queue signature is empty
PASS  re-editing one id changes the signature — one:v1 -> one:v2
PASS  the signature is order-independent
PASS  a later write gets a strictly later stamp — 2026-10-01T16:20:00.803Z -> 2026-10-01T16:20:00.804Z
PASS  a write after pulling a future stamp lands after it — 2030-01-01T00:00:00.000Z -> 2030-01-01T00:00:00.001Z
PASS  the remote winner is stored — <p>new</p>
PASS  the losing local copy is cleared from the queue — {}
PASS  the late edit is stored during the push
PASS  the late edit stays queued instead of being cleared by the remote win — {"x":"2026-10-01T16:20:00.805Z","y":"2026-09-01T00:00:00.000Z"}
PASS  the late edit is not lost
PASS  the local tie winner is kept — sad
PASS  the tie winner is re-stamped past the shared stamp — 2026-10-01T16:20:00.805Z
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
exit=0
=== check-sync-storage ===

# sync storage and ownership
PASS  deleteEntry reports success
PASS  the deleted record is still stored as a tombstone — gone(tomb),kept
PASS  the deleted record is hidden from listEntries
PASS  the deleted record is still in listAllRecords
PASS  the surviving entry is untouched
PASS  the deletion is queued for upload — {"gone":"2026-10-01T16:20:01.401Z"}
PASS  the first delete succeeds
PASS  the second delete is refused
PASS  updateEntry refuses a tombstoned entry — null
PASS  the tombstone is unchanged
PASS  the tombstone survives an unrelated create — 92a1af8f-5f9d-4c3f-a056-cea8e6866e1b,dead(tomb),live
PASS  the tombstone stays hidden after the create
PASS  the tombstone survives an unrelated edit — 92a1af8f-5f9d-4c3f-a056-cea8e6866e1b,dead(tomb),live
PASS  the tombstone survives another delete — 92a1af8f-5f9d-4c3f-a056-cea8e6866e1b,dead(tomb),live(tomb)
PASS  both tombstones are present — 92a1af8f-5f9d-4c3f-a056-cea8e6866e1b,dead(tomb),live(tomb)
PASS  clear all writes tombstones for every entry — a(tomb),b(tomb)
PASS  clear all leaves no visible entry
PASS  clear all keeps the records for sync
PASS  clear all queues every tombstone — {"a":"2026-10-01T16:20:01.403Z","b":"2026-10-01T16:20:01.403Z"}
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
PASS  the queue is written to storage — {"persist":"2026-10-01T16:20:01.403Z"}
PASS  the queue stamp matches the tombstone stamp
PASS  the tombstone keeps the id — secret
PASS  the tombstone keeps the deleted stamp — 2026-10-01T16:20:01.404Z
PASS  the tombstone keeps a valid updated stamp — 2026-10-01T16:20:01.404Z
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
exit=0
=== check-sync-removed ===
PASS  a tombstone is preserved in storage, not dropped — live-1, deleted-1(tomb), live-2
PASS  the tombstone is not shown as a visible entry
PASS  the live entries are untouched — live=2
PASS  a deleted entry is kept as a tombstone — gone-1(tomb), kept-1
PASS  the deleted entry is gone from the visible list
PASS  the tombstone survives an unrelated write — 1fdad3b8-206c-43e8-89c3-0b3d221876b7, gone-1(tomb), kept-1
PASS  the unrelated write is stored
PASS  clear all writes tombstones for every entry — a(tomb), b(tomb)
PASS  clear all leaves nothing visible
FAIL  no Account entry in the settings nav — Entries, Calendar, Stats, Profile, Appearance, Privacy, Account, Data, About
FAIL  no sign-in form rendered
FAIL  no link points at the sync section
FAIL  the privacy copy is the unconditional local-only line
PASS  no request left for a Supabase origin — none
PASS  no request left the app origin except images — https://api.dicebear.com/9.x/lorelei/svg?seed=willow | https://api.dicebear.com/9.x/lorelei/svg?seed=willow | https://api.dicebear.com/9.x/lorelei/svg?seed=willow
PASS  /: no request left for a Supabase origin — none
PASS  /: no Supabase chunk downloaded — none
PASS  /: only images leave the app origin (DiceBear permitted) — none
PASS  /dashboard: no request left for a Supabase origin — none
PASS  /dashboard: no Supabase chunk downloaded — none
PASS  /dashboard: only images leave the app origin (DiceBear permitted) — https://api.dicebear.com/9.x/lorelei/svg?seed=willow
PASS  /settings: no request left for a Supabase origin — none
PASS  /settings: no Supabase chunk downloaded — none
PASS  /settings: only images leave the app origin (DiceBear permitted) — https://api.dicebear.com/9.x/lorelei/svg?seed=willow | https://api.dicebear.com/9.x/lorelei/svg?seed=harbor | https://api.dicebear.com/9.x/lorelei/svg?seed=ember
PASS  /stats: no request left for a Supabase origin — none
PASS  /stats: no Supabase chunk downloaded — none
PASS  /stats: only images leave the app origin (DiceBear permitted) — https://api.dicebear.com/9.x/lorelei/svg?seed=willow
PASS  the reader still renders after the re-enable
PASS  no page errors

4 FAILED
exit=1
```

```
$ ls reports/ reports/apply/
reports/:
apply  perf

reports/apply/:
00-state.md  swarm-master-prompt.md  swarm-prompt-pack.md

$ wc -l scripts/check-sync-*.mjs
  329 scripts/check-sync-harness.mjs
  256 scripts/check-sync-merge.mjs
  337 scripts/check-sync-race.mjs
  249 scripts/check-sync-removed.mjs
  302 scripts/check-sync-storage.mjs
 1473 total
```

Bukti pendukung (in-scope, eksekusi terpisah):

```
$ node scripts/smoke-routes.mjs
/            rendered=  164 chars  ok
/dashboard   rendered=  636 chars  ok
/write       rendered=  557 chars  ok
/calendar    rendered=  321 chars  ok
/stats       rendered=  363 chars  ok
/settings    rendered= 1463 chars  ok
no console errors
exit=0

$ node scripts/check-pdf-export.mjs
pdf libs on wire before export: 0
pdf libs on wire after export:  2
download: export-probe.pdf
no page errors
PASS
exit=0

$ node -e "<compare CSP strings>"
vercel === netlify: true
vercel === serve : false
serve missing upgrade-insecure-requests: true
```

## Handoff

Untuk pemilik suite (F6) / lead:

1. A3-01 (P1, S): jalankan config-off guard yang sudah didokumentasi di `reports/apply/swarm-prompt-pack.md:109` —
   `mv .env.local .env.local.bak && npm run build && node scripts/check-sync-removed.mjs; mv .env.local.bak .env.local && npm run build`.
   Koreksi klaim "ALL PASS (29)" di `reports/perf/supabase-sync-implementation.md:102` agar menyebut syarat build config-off, atau ganti angka dengan status build config-off yang benar-benar dijalankan.
2. A3-06 (P1, S): tambah satu stub `push` di `check-sync-race.mjs` yang mengembalikan `['a']` untuk dua id outgoing; assert id yang tidak diterima tetap di outbox. Ini menutup cabang `engine.ts:76-80` tanpa tes.
3. A3-04 / A3-05 (P1, M): pindahkan pagination dan accepted-ids dari grep ke perilaku. Pagination butuh stub `from('entries').select().order().range()` yang mengembalikan 2 halaman; accepted-ids butuh stub RPC. Kalau harness tidak mau menumbuhkan klien palsu, tandai eksplisit sebagai "structural assertion, bukan behavioral" di header suite.
4. A3-02 / A3-03 (P2, S): samakan `serve-with-csp.mjs` dengan `vercel.json`/`netlify.toml` (tambah `upgrade-insecure-requests`), lalu tambah satu check yang membandingkan ketiga string CSP. Sekarang selisih itu tak terdeteksi.
5. A3-07 (P1, S): tambah `"test"` di `package.json` yang menjalankan ke-4 suite murni + (opsional) guard config-off, agar coverage ter-gate.

Tidak ada P0.

## Catatan

- Tidak ada P0. Tidak ada indikasi data loss / kebocoran pada jalur yang diuji.
- Temuan P1 seluruhnya soal bukti (klaim tanpa tes perilaku), bukan bug fitur yang terbukti. Jalur tombstone/race/merge/owner TERCAKUP perilaku dan hijau.
- `dist/` saat ini membawa sync ON dengan kredensial Supabase nyata yang ter-inline (`.env.local` gitignored; anon key publik by design). Ini bukan temuan audit suite, tapi menjelaskan kenapa A3-01 muncul.
- Klaim "tidak ada round-trip live" di `reports/perf/supabase-sync-implementation.md:178` JUJUR dan didukung: suite butuh kredensial. Tidak dihitung sebagai klaim palsu.
- Batas baris `syncStore.ts` (197) dan `SyncSignIn.tsx` (115) dilaporkan benar oleh `00-state.md:37-38`; di luar scope audit ini.
