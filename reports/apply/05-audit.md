# 05 — Audit UI/UX + a11y + copy (sync OTP)

Ringkasan:
- SyncSection/SyncSignIn berfungsi untuk happy path, tapi belum ada gate `ready`: form sign-in
  ter-flash dulu sebelum `restore()` selesai saat ada sesi tersimpan.
- Error OTP async tidak diumumkan ke screen reader (tanpa `role="alert"`/`aria-live`), dan
  rate-limit dilaporkan sebagai masalah koneksi.
- Pengungkapan "plain text ke server" baru muncul SETELAH sign-in; tidak ada peringatan di CTA.
- `CODE_MAX = 8` bertentangan dengan komentar sendiri (6..10) → proyek `otp_length` 9/10 tidak bisa login.
- Tanpa emoji (lint hijau), config-off menyembunyikan UI sepenuhnya. **Tidak ada P0.**

## Tabel temuan

| ID | Masalah | file:baris | Bukti/dampak | Prio | Effort |
|----|---------|-----------|--------------|------|--------|
| SYNC-01 | Tidak ada gate loading/`ready`: form sign-in dirender saat `account===null` sebelum `restore()` selesai → flash UI salah saat sesi tersimpan ada | src/pages/Settings/sections/SyncSection.tsx:36 ; src/store/syncStore.ts:119-156 | `ready` hanya dibaca di `src/hooks/useSyncLifecycle.ts:21`; grep `ready` di Settings/Footer/Header = 0 hit. Restore async (dynamic import adapter + `getSession()`), UI langsung tampil signed-out | P1 | S |
| SYNC-02 | Error OTP async (kode salah/expired) dirender sebagai `<p>` biasa tanpa `role="alert"`/`aria-live` → SR tidak mengumumkan | src/components/ui/Input.tsx:46-52 ; src/pages/Settings/sections/SyncSignIn.tsx:84 | `aria-describedby`+`aria-invalid` ada, tapi perubahan teks async tidak di-announce. Pola `role="alert"` sudah dipakai di `DataSection.tsx:54`, `SidebarDetails.tsx:37` | P1 | S |
| SYNC-03 | Rate-limit / error auth non-token salah dilaporkan "Could not reach the server. Check your connection and try again." | src/pages/Settings/sections/SyncSignIn.tsx:47,59 ; src/services/supabase/auth.ts:60-66 | `verifyCode` hanya `return null` untuk `/invalid|expired|token/`; sisanya (mis. "Email rate limit exceeded") throw → toast salah diagnosis. `requestCode` juga selalu pakai pesan koneksi | P1 | S |
| SYNC-04 | Pengungkapan upload plain text baru muncul setelah signed-in; CTA sign-in tidak memperingatkan | src/pages/Settings/sections/SyncSignIn.tsx:63-65 ; SyncSection.tsx:58-61 ; PrivacySection.tsx:18 | Paragraf sign-in hanya "keep the same entries on your phone and your laptop". Warning plaintext ada di blok signed-in (post-consent) → pengguna commit dulu, diberi tahu kemudian | P1 | S |
| SYNC-05 | `CODE_MAX=8` bertentangan dengan komentar "6 to 10"; `otp_length` 9/10 memblokir sign-in, dan paste kode panjang dipotong senyap | src/pages/Settings/sections/SyncSignIn.tsx:12-14,26-27,81 | Komentar mengklaim "keeps the form working whether default or raised"; Supabase `otp_length` 6..10 (`supabase/config.toml:233` = 6). Naikkan batas atau baca dari konstanta | P1 | S |
| LINE-01 | `SyncSignIn.tsx` 115 baris > 100 (batas `pages`) | src/pages/Settings/sections/SyncSignIn.tsx (115) | Invariant dilanggar. Pecah: ekstrak `SyncEmailForm`+`SyncCodeForm`, atau pindahkan wrapper `run`/busy ke hook | P1 | S |
| SYNC-06 | Focus hilang saat stage `email`→`code`; input kode tidak menerima fokus, tombol pemicu sudah unmount | src/pages/Settings/sections/SyncSignIn.tsx:66-86 | grep `autoFocus|useRef|focus()` di file = 0 hit. Pengguna keyboard harus Tab dari atas halaman | P2 | S |
| SYNC-07 | Menu HeaderProfile: tanpa pindah fokus saat buka, tanpa navigasi panah, Escape tidak mengembalikan fokus ke tombol | src/components/layout/Header/HeaderProfile.tsx:31-46 | `role="menu"`+`role="menuitem"` ada, tapi tidak ada roving tabindex / fokus awal / restore fokus (Escape hanya `setOpen(false)`) | P2 | M |
| SYNC-08 | Tombol busy ganti label tanpa `aria-busy`/live; "Sign out" tidak di-disable saat `syncing` | src/pages/Settings/sections/SyncSignIn.tsx:89-109 ; SyncSection.tsx:48-53 | `disabled` ada (baik), tapi perubah label tidak diumumkan; sign-out di tengah pass memicu race (pass selesai menulis `set({status:'idle'})` setelah akun null) | P2 | S |
| SYNC-09 | `pendingCount()` tidak reaktif → "Everything is uploaded." bisa basi setelah write lokal | src/pages/Settings/sections/SyncSection.tsx:27,40 ; src/hooks/syncQueueState.ts | Baca `readOutbox()` sinkron per render tanpa langganan store; hanya ter-refresh saat status sync berubah | P2 | S |
| SYNC-10 | Copy toggle "private" tidak menyatakan entri privat juga diunggah plain text saat signed-in | src/pages/Settings/sections/PrivacySection.tsx:42-45 | Teks menyebut tidak terenkripsi di storage lokal, tapi tidak menghubungkan ke upload cloud → kesan "private" lebih aman dari kenyataan | P2 | S |

## Output mentah

```
$ wc -l src/pages/Settings/sections/*.tsx src/components/layout/Footer.tsx src/components/layout/Header/HeaderProfile.tsx src/pages/Settings/Settings.tsx src/components/common/ConfirmDialog.tsx
   58 src/pages/Settings/sections/AboutSection.tsx
   81 src/pages/Settings/sections/AppearanceSection.tsx
   99 src/pages/Settings/sections/DataSection.tsx
   48 src/pages/Settings/sections/PrivacySection.tsx
   60 src/pages/Settings/sections/ProfileSection.tsx
   32 src/pages/Settings/sections/RestoreDefaultsButton.tsx
   68 src/pages/Settings/sections/SyncSection.tsx
  115 src/pages/Settings/sections/SyncSignIn.tsx
   32 src/components/layout/Footer.tsx
   89 src/components/layout/Header/HeaderProfile.tsx
   67 src/pages/Settings/Settings.tsx
   53 src/components/common/ConfirmDialog.tsx
  802 total
```

```
$ npm run lint:emoji 2>&1 | tail -5
> deardiary@1.0.0 lint:emoji
> eslint src --ext .ts,.tsx
(exit 0, tanpa output pelanggaran)
```

```
$ grep -rn "aria-\|role=\|disabled=\|aria-live" src/pages/Settings/sections/Sync*.tsx
src/pages/Settings/sections/SyncSignIn.tsx:89:          <Button variant="gold" onClick={() => void sendCode()} disabled={busy || !email.includes('@')}>
src/pages/Settings/sections/SyncSignIn.tsx:94:            <Button variant="gold" onClick={() => void confirmCode()} disabled={busy || code.length < CODE_MIN}>
src/pages/Settings/sections/SyncSignIn.tsx:103:              disabled={busy}
src/pages/Settings/sections/SyncSignIn.tsx:107:            <Button variant="ghost" onClick={() => void sendCode()} disabled={busy}>
src/pages/Settings/sections/SyncSection.tsx:31:    <section aria-labelledby="sync-heading" className="flex flex-col gap-3">
src/pages/Settings/sections/SyncSection.tsx:43:            <p role="status" className="font-body text-xs text-muted">
src/pages/Settings/sections/SyncSection.tsx:48:            <Button variant="outline" onClick={() => void sync()} disabled={status === 'syncing'}>
```

```
$ grep -rn "syncEnabled\|VITE_SUPABASE\|import.meta.env" src/pages/Settings/sections/Sync*.tsx src/pages/Settings/Settings.tsx
src/pages/Settings/Settings.tsx:4:import { syncEnabled } from '@/services/supabase/config';
src/pages/Settings/Settings.tsx:15:const SYNC_LINKS = syncEnabled() ? [{ href: '#sync-heading', label: 'Account' }] : [];
src/pages/Settings/Settings.tsx:60:          {syncEnabled() ? <SyncSection /> : null}
```

```
$ grep -rn "role=\"alert\"" src --include=*.tsx
src/pages/Settings/sections/DataSection.tsx:54:        <p role="alert" className="font-body text-xs text-error">
src/pages/Write/SidebarDetails.tsx:37:        <p role="alert" className="flex items-start gap-1 font-body text-xs text-error">

$ grep -rn "aria-live" src --include=*.tsx
src/components/calendar/CalendarHeader.tsx:18:      <h2 ... aria-live="polite">
src/pages/Write/SidebarDetails.tsx:42:        <p aria-live="polite" ...>
src/pages/Reader/ReaderNav.tsx:33:        <span aria-live="polite" ...>

$ grep -rn "aria-live\|role=\"alert\"" src/components/ui/Input.tsx src/pages/Settings/sections/SyncSignIn.tsx
(exit 1 — tidak ada)
```

```
$ grep -rn "\.ready\|state.ready" src --include=*.ts --include=*.tsx
src/hooks/useSyncLifecycle.ts:21:  const ready = useSyncStore((state) => state.ready);
```

```
$ grep -n "autoFocus\|useRef\|focus()" src/pages/Settings/sections/SyncSignIn.tsx
(exit 1 — tidak ada)
```

```
$ grep -rn "ConfirmDialog" src/pages/Settings/sections/Sync*.tsx src/store/syncStore.ts
(exit 1 — sync tidak memakai ConfirmDialog)
```

```
$ grep -nP '[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}\x{FE0F}\x{200D}]' <9 file scoped>
(exit 1 — tanpa emoji; non-ASCII yang ada hanya '…' (ellipsis), '—' (em dash), '·' (middot) = tipografi sah)
```

## Handoff

Untuk agen fix berikutnya (A6):
1. SYNC-01: gate body `SyncSection` dengan `ready` dari store → tampilkan skeleton/placeholder
   netral sampai `restore()` selesai, jangan render form sign-in dulu.
2. SYNC-02 + SYNC-08: tambah dukungan live-region pada `Input` (mis. `role="alert"` untuk
   `error`, atau `aria-live="polite"`), atau bungkus pesan error di SyncSignIn. Tambah
   `aria-busy` pada tombol busy.
3. SYNC-03: petakan pesan Supabase ke kategori (rate-limit vs koneksi vs kode salah) di
   `auth.ts`/`SyncSignIn`, jangan satu string koneksi untuk semua kegagalan.
4. SYNC-04 + SYNC-10: pindahkan peringatan plaintext ke paragraf sign-in (pre-consent) dan
   tambahkan kalimat di toggle private bahwa entri privat juga diunggah.
5. SYNC-05: samakan `CODE_MAX` dengan `otp_length` terdokumentasi (6..10) atau ekspor konstanta
   bersama.
6. LINE-01: pecah `SyncSignIn.tsx` ≤100 baris (ekstrak `SyncEmailForm`/`SyncCodeForm` atau hook
   `useSyncSignIn`).
7. SYNC-06/SYNC-07/SYNC-09: fokus ke input kode saat ganti stage, perbaiki fokus menu, dan buat
   `pendingCount` reaktif (langganan store/outbox).

## Catatan

Tidak ada temuan P0. Config-off terverifikasi: `Settings.tsx:15` (nav link) dan `:60` (render
`SyncSection`) keduanya digate `syncEnabled()`; `SyncSection` tidak pernah di-mount tanpa env,
sehingga UI sync tersembunyi penuh. Sanitasi boundary tidak disentuh audit ini (read-only).
Copy privacy/about/footer konsisten dengan adanya upload Supabase (jujur menyebut plain text);
celahnya hanya soal WAKTU pengungkapan (SYNC-04), bukan kebohongan isi.
