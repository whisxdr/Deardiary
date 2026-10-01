# 02 — Audit Auth/Session (A2, READ-ONLY)

## Ringkasan

1. Dynamic import SDK benar: `@supabase/supabase-js` hanya di-import dinamis dari `client.ts`, dua import statis lain murni `import type`. Tidak bocor ke bundle awal.
2. `syncEnabled()` memblokir semua jalur jaringan saat env kosong. Terverifikasi: `check-sync-removed.mjs` mencatat nol request ke origin Supabase.
3. Owner switch mengosongkan entri + outbox lama (by design, terbukti di `check-sync-storage.mjs` kasus 9), TAPI draft dan settings tidak ikut dikosongkan — kebocoran konten antar-akun di satu browser.
4. OTP: tidak ada cooldown, dan pesan error Supabase (mis. 429 rate limit) dibuang lalu diganti toast generik "Could not reach the server" — misleading, bukan silent.
5. Penolakan RLS/RPC pada push tidak memunculkan error: RPC balik `[]`, engine membacanya sebagai "rejected, keep queued", status tetap `idle`. User melihat "N waiting to upload" selamanya tanpa penjelasan.

## Tabel Temuan

| ID | Masalah | file:baris | Bukti/dampak | P0/P1/P2 | Effort |
|----|---------|-----------|--------------|----------|--------|
| F1 | Owner switch tidak mengosongkan draft dan settings. `clearLocalEntries()` hanya menulis `saveEntries([])` + `writeOutbox({})`. Draft milik user A masih bisa dibuka user B lewat "Continue Writing"; displayName/bio/avatar A terbawa ke B. | `src/services/sync/owner.ts:19-22`; draft dibaca `src/pages/Write/writeFormStart.ts:37`, dipakai `src/pages/Landing/Landing.tsx:34`; settings `src/services/settingsService.ts:58-60` | Kebocoran konten privat (draft) + identitas (settings) di browser bersama. Entri sudah dibersihkan, jadi ini celah inkonsisten pada jalur yang sama. | P1 | S |
| F2 | OTP tanpa cooldown; pesan error server dibuang. `requestCode` throw `new Error(error.message)` tetapi `SyncSignIn.run` menangkap dan menampilkan toast generik. Pesan 429 ("you can only request this after N seconds") hilang, user diberi tahu salah bahwa koneksinya rusak. | `src/services/supabase/auth.ts:37-44`; `src/pages/Settings/sections/SyncSignIn.tsx:30-38,42-47` | Salah diagnosa; user menekan "Send a new code" berulang, memperpanjang rate limit. Tidak silent, tapi misleading. | P1 | S |
| F3 | Penolakan RLS/RPC saat push tidak dilaporkan. `upsert_entries` mengembalikan `setof text`; bila RLS menolak (auth.uid() null / policy salah), tidak ada baris yang dikembalikan → adapter balik `[]` → engine `delete settled[id]` (keep queued) tapi `pushed = outgoing.length`, `report.error` kosong → status `idle`, pesan `''`. | `src/services/supabase/adapter.ts:45-48`; `src/services/sync/engine.ts:76-83` | Antrean tak pernah kosong, user melihat "N waiting to upload" tanpa error. Kegagalan RLS tak bisa dibedakan dari penolakan stale-stamp. Pull dengan RLS-select salah juga balik `[]` tanpa error → diary server tak pernah muncul. | P1 | M |
| F4 | `resume`/`currentAccount` memakai `getSession()` yang lokal, bukan validasi server. Komentar kontrak di types.ts menyatakan "Confirms the stored session is still accepted", padahal `getSession` membaca storage (refresh token bila kedaluwarsa). Sesi yang di-revoke server tetap terbaca signed-in sampai request pertama gagal. | `src/services/supabase/auth.ts:59-64`; `src/services/sync/types.ts:36-37`; `src/store/syncStore.ts:131-150` | UI sempat bilang signed-in walau sesi mati. Tidak silent (sync berikutnya error 401 → status `error`), tapi kontrak kode salah dan ada jendela salah-lapor. | P2 | M |
| F5 | Race sign-out vs sync in-flight. `signOut` set `account:null, status:'signed-out'` lalu `await adapter().signOut()`; pass `sync()` yang sudah berjalan memegang account dan bisa menulis `status:'error'`/`'offline'` + `message` SETELAH sign-out. | `src/store/syncStore.ts:158-190` | Pesan error basi bisa muncul di layar sign-in (ter-render sebagai error field kode). Bukan kebocoran data (push tetap data A sendiri). | P2 | S |
| F6 | `verifyCode` di store tidak dijaga `enabled()`; `requestCode` dijaga. | `src/store/syncStore.ts:88-98` | Inkonsistensi. Praktis masih throw (`SyncDisabledError`) jadi tidak silent, tapi guard-nya tidak seragam. | P2 | S |
| F7 | `onAuthChange` mengembalikan unsubscribe yang tidak pernah dipanggil store, dan racy: bila unsubscribe dipanggil sebelum `promise.then` selesai, `subscription` masih `null` → listener bocor. | `src/services/supabase/auth.ts:82-95`; pemanggil `src/store/syncStore.ts:62-80` (komentar 79-80) | Dormant: `watching` menjamin satu subscription seumur app, jadi tidak bocor hari ini. Jebakan bila nanti dipanggil dari komponen. | P2 | S |
| F8 | `pendingCount()` di SyncSection dihitung saat render, tidak reaktif terhadap perubahan outbox (outbox localStorage biasa, tanpa subscription). | `src/pages/Settings/sections/SyncSection.tsx:27` | Angka "waiting to upload" bisa basi sampai re-render lain (status/account berubah). | P2 | S |
| F9 | `restore()` catch menyetel `status:'offline'` dengan `account:null`, `ready:true`. Bila refresh token gagal, UI menampilkan form sign-in walau sesi mungkin masih ada. | `src/store/syncStore.ts:151-155` | User bisa meminta kode baru tanpa perlu (memicu rate limit, lihat F2). | P2 | S |
| F10 | Suite browser `check-sync-removed.mjs` FAIL 4 dari konteks ini: build yang diuji berjalan dengan sync ENABLED, padahal suite mengasumsikan no-env. | `scripts/check-sync-removed.mjs` (butuh `node scripts/serve-with-csp.mjs` + build tanpa env) | Bukan cacat kode; artefak build/env saat saya jalankan. Suite butuh server CSP dan build no-env. | P2 | S |

Catatan: TIDAK ada temuan P0.

## Output Perintah Mentah

### CMD1 — grep simbol auth/sync
```
$ grep -rn "supabase-js\|createClient\|onAuthStateChange\|signOut\|signInWithOtp\|verifyOtp\|deardiary:owner\|syncEnabled" src/ --include=*.ts --include=*.tsx
src/\components\layout\Footer.tsx:2:import { syncEnabled } from '@/services/supabase/config';
src/\components\layout\Footer.tsx:14:  if (!syncEnabled()) return `${base}your words stay on this device.`;
src/\pages\Settings\Settings.tsx:4:import { syncEnabled } from '@/services/supabase/config';
src/\pages\Settings\Settings.tsx:15:const SYNC_LINKS = syncEnabled() ? [{ href: '#sync-heading', label: 'Account' }] : [];
src/\pages\Settings\Settings.tsx:60:          {syncEnabled() ? <SyncSection /> : null}
src/\pages\Settings\sections\AboutSection.tsx:3:import { syncEnabled } from '@/services/supabase/config';
src/\pages\Settings\sections\AboutSection.tsx:15:  if (!syncEnabled()) {
src/\pages\Settings\sections\PrivacySection.tsx:2:import { syncEnabled } from '@/services/supabase/config';
src/\pages\Settings\sections\PrivacySection.tsx:14:  if (!syncEnabled()) return 'Entries never leave this browser unless you export them yourself.';
src/\services\supabase\client.ts:1:import type { SupabaseClient } from '@supabase/supabase-js';
src/\services\supabase\client.ts:2:import { supabaseAnonKey, supabaseUrl, syncEnabled } from './config';
src/\services\supabase\client.ts:7: * `@supabase/supabase-js` is imported dynamically rather than at the top of the file. It
src/\services\supabase\client.ts:18:  if (!syncEnabled()) return null;
src/\services\supabase\client.ts:20:    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
src/\services\supabase\client.ts:21:      createClient(supabaseUrl(), supabaseAnonKey(), {
src/\services\supabase\auth.ts:1:import type { User } from '@supabase/supabase-js';
src/\services\supabase\auth.ts:29: * `signInWithOtp` with `shouldCreateUser: true`: the first sign-in is also the sign-up, so
src/\services\supabase\auth.ts:39:  const { error } = await supabase.auth.signInWithOtp({
src/\services\supabase\auth.ts:49:  const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
src/\services\supabase\auth.ts:67:export async function signOut(): Promise<void> {
src/\services\supabase\auth.ts:69:  const { error } = await supabase.auth.signOut();
src/\services\supabase\auth.ts:88:      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
src/\store\syncStore.ts:2:import { syncEnabled } from '@/services/supabase/config';
src/\store\syncStore.ts:22:  signOut: () => Promise<void>;
src/\store\syncStore.ts:56:  const enabled = (): boolean => injected !== undefined || syncEnabled();
src/\store\syncStore.ts:64:      if (injected || watching || !syncEnabled()) return;
src/\store\syncStore.ts:183:      signOut: async () => {
src/\store\syncStore.ts:189:        if (account && enabled()) await (await adapter()).signOut(account).catch(() => undefined);
src/\services\index.ts:51:export { getSupabase, supabaseAdapter, syncEnabled } from './supabase';
src/\services\supabase\adapter.ts:4:import { currentAccount, requestCode, signOut, verifyCode } from './auth';
src/\services\supabase\adapter.ts:36:  signOut: () => signOut(),
src/\pages\Settings\sections\SyncSection.tsx:25:  const signOut = useSyncStore((state) => state.signOut);
src/\pages\Settings\sections\SyncSection.tsx:51:            <Button variant="ghost" onClick={() => void signOut()}>
src/\services\supabase\index.ts:2:export { currentAccount, requestCode, signOut, verifyCode } from './auth';
src/\services\supabase\index.ts:4:export { supabaseAnonKey, supabaseUrl, syncEnabled } from './config';
src/\services\supabase\config.ts:9:export function syncEnabled(): boolean {
src/\services\sync\types.ts:50:  signOut(account: Account): Promise<void>;
src/\services\supabase\auth.ts:88 (lanjutan) onAuthStateChange
```

### CMD2 — dynamic import di services/supabase
```
$ grep -rn "import(" src/services/supabase/
src/services/supabase/\client.ts:20:    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
```

### CMD2b — bukti tidak ada import statis SDK (hanya type)
```
$ grep -rn "from '@supabase" src/ --include=*.ts --include=*.tsx
src/\services\supabase\client.ts:1:import type { SupabaseClient } from '@supabase/supabase-js';
src/\services\supabase\auth.ts:1:import type { User } from '@supabase/supabase-js';
```

### CMD3 — harness
```
$ node scripts/check-sync-harness.mjs

# sync harness self-check
PASS  sync barrel loaded
PASS  entry query loaded
PASS  entry write loaded
PASS  oracle agrees with the real merge on a two-sided case
ALL PASS
EXIT=0
```

### CMD4 — suite pendukung (bonus)
```
$ node scripts/check-sync-storage.mjs   -> ALL PASS (termasuk kasus 9: foreign sign-in menjatuhkan entri+queue, dan kasus 10: owner key hilang -> entri diadopsi)
$ node scripts/check-sync-merge.mjs     -> ALL PASS
$ node scripts/check-sync-removed.mjs   -> 4 FAILED (build yang diuji berjalan dengan sync ENABLED; butuh serve-with-csp + build no-env) — lihat F10
```

## Verifikasi Klaim per Tugas

1. Owner switch: entri + outbox lama DIKOSONGKAN benar (owner.ts:19-22, bukti check-sync-storage kasus 9). Owner key sengaja disimpan agar sign-in berikutnya tahu pemiliknya. BOCOR: draft + settings (F1).
2. Session restore: `restore()` -> `currentAccount()` -> `getSession()`; refresh token ditangani SDK (autoRefreshToken:true, client.ts:27). Tidak ada jalur "UI signed-in tanpa sesi sama sekali"; hanya sesi ter-revoke server yang telat terdeteksi (F4).
3. Sign-out: sesi SDK dibersihkan (`auth.signOut`), state store di-reset, pesan dibersihkan. Queue/owner/entri sengaja dipertahankan. Race push in-flight ada tapi benign (F5).
4. Rate limit OTP: TIDAK ada cooldown; error 429 ditelan menjadi toast generik (F2).
5. Error states: requestCode/verifyCode/network terlihat; RLS/RPC-deny push dan pull TIDAK terlihat (F3); 429 salah dilaporkan (F2).
6. onAuthStateChange: subscription tunggal (guarded `watching`), tidak ada loop (echo same-id early-return, syncStore.ts:76). Unsubscribe tidak dipakai + racy (F7). SIGNED_OUT/TOKEN_REFRESHED ditangani via null/session yang sama.
7. Dynamic import: BENAR (CMD2/CMD2b). Barrel `@/services` hanya menarik adapter/auth/client yang type-only terhadap SDK.
8. config.ts: `syncEnabled()` false -> `getSupabase()` null -> tidak ada panggilan jaringan (CMD3 + check-sync-removed "no request ... Supabase origin").

## Handoff

- F1 (draft/settings bocor): perlu keputusan produk — apakah owner-switch harus menghapus `deardiary:draft` (dan mungkin mereset settings ke default). Kalau ya, tambahkan di `clearLocalEntries()`.
- F2 (OTP 429): tampilkan `error.message` asli Supabase + hitung mundur; jangan ganti dengan teks koneksi.
- F3 (RLS silent): engine perlu membedakan "rejected stale-stamp" (tetap queue, tanpa error) dari "nol diterima karena RLS/auth" (harus error). Cara termurah: bila `accepted.length === 0 && outgoing.length > 0`, set `report.error`.
- F4: kalau memang butuh validasi server, pakai `supabase.auth.getUser()` (network) di `resume`, atau perbaiki komentar kontraknya.
- F10: jalankan `node scripts/serve-with-csp.mjs` lalu suite browser dengan build no-env.

## Catatan

Tidak ada P0. Ada 3 temuan P1 (F1, F2, F3) dan 7 temuan P2. Semua batas baris file dipatuhi (dicek oleh check-sync-storage: "every service file is within 120 lines").
