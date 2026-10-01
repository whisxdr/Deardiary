# 12 — Fix UI (W2-UI)

Scope: `src/pages/Settings/sections/*`, `src/components/ui/Input.tsx`.
Branch: `apply/supabase-sync`. No git commands, no `npm run build`, no `src/services/**` edits.

## Ringkasan

Lima temuan P1 (SYNC-01..05) plus LINE-01 diperbaiki. `SyncSignIn.tsx` dipotong 115 -> 57 baris
dengan mengekstrak hook `useSyncSignIn` (state + `run`/`sendCode`/`confirmCode`) ke sibling file
`useSyncSignIn.ts` (74 baris). Komentar keputusan (kenapa code bukan link, kenapa error asli
menang) dipindah, bukan dibuang. Tidak ada perubahan alur auth, sanitasi, atau perilaku lain.
Tidak ada tes browser dijalankan (butuh server CSP + dist) — verifikasi statis saja.

## Perubahan

### SYNC-01 — gate `ready`
`src/pages/Settings/sections/SyncSection.tsx:22` — tambah `const ready = useSyncStore((state) => state.ready);`
`src/pages/Settings/sections/SyncSection.tsx:64-68` — `account ? ... : !ready ? <p>Checking your session…</p> : <SyncSignIn />`.
`restore()` async (dynamic import adapter + `getSession()`), jadi dengan sesi tersimpan form
sign-in sempat flash lalu swap. `!ready` sekarang menahan render `SyncSignIn` sampai sesi dicek.
Store sudah men-set `ready: true` di `restore` (semua cabang) dan `verifyCode`, jadi tidak ada
perubahan store. Saat `!ready` dirender satu baris placeholder netral.

### SYNC-02 — error OTP diumumkan ke screen reader
`src/components/ui/Input.tsx:47` — `role={error ? 'alert' : undefined}` pada `<p>` pesan.
Aditif: hanya aktif saat `error` ada; hint tetap tanpa role, perilaku lain tidak berubah. Pola
sama dengan `DataSection.tsx:54` (`role="alert"`). Verifikasi: `grep -rn "ui/Input"` hanya
`TagInput.tsx`, `SidebarDetails.tsx`, `DatePicker.tsx` — tidak ada yang bergantung pada
ketiadaan atribut ini (atribut ARIA tidak mengubah render visual).

### SYNC-03 — rate limit tidak lagi dilaporkan sebagai masalah koneksi
`src/pages/Settings/sections/useSyncSignIn.ts:40-44` — `catch (error)` sekarang memakai
`error.message` bila ada, string koneksi hanya fallback:
```ts
} catch (error) {
  toast.error(error instanceof Error && error.message ? error.message : failure);
}
```
Parameter `failure` dipertahankan sebagai fallback. Pesan asli Supabase (mis. "you can only
request this after N seconds") kini tampil. Tidak menyentuh `src/services/supabase/auth.ts`.

### SYNC-04 — peringatan plaintext sebelum commit
`src/pages/Settings/sections/SyncSignIn.tsx:11-13` — paragraf pre-sign-in ditambah satu kalimat:
"Signing in uploads your entries to the Supabase server as plain text, not encrypted." User tahu
sebelum sign-in, bukan sesudah (blok signed-in `SyncSection.tsx` tetap).

### SYNC-05 — CODE_MAX konsisten dengan rentang terdokumentasi
`src/pages/Settings/sections/useSyncSignIn.ts:5-6` — `CODE_MIN = 6`, `CODE_MAX = 10` (otp_length
Supabase sah 6..10). Komentar di atas hook diperbaiki agar konsisten ("6 to 10 digits").
`placeholder="000000"` tetap (kode default 6 digit) — jujur karena hanya contoh format, dan
`slice(0, CODE_MAX)` kini tidak memotong kode 9-10 digit secara senyap.

### LINE-01 — SyncSignIn.tsx > 100 baris
`src/pages/Settings/sections/SyncSignIn.tsx` 115 -> 57 baris. Ekstraksi hook `useSyncSignIn` ke
`src/pages/Settings/sections/useSyncSignIn.ts` (74 baris, <= 100). `sections/index.ts` tidak
diubah: barrel hanya mengekspor komponen publik, dan `SyncSignIn` masih diekspor (dipakai
`SyncSection`). Hook bersifat internal section, tidak perlu masuk barrel.

### PrivacySection.tsx
Tidak diubah — copy sudah jujur (menyatakan plain text, bukan enkripsi) dan tidak ada temuan P1
yang menuntut edit di file ini.

## Output mentah

### SEBELUM
```
$ cd "D:/.1Kuliah/Coding/Dear dia" && wc -l src/pages/Settings/sections/Sync*.tsx src/components/ui/Input.tsx
  68 src/pages/Settings/sections/SyncSection.tsx
 115 src/pages/Settings/sections/SyncSignIn.tsx
  58 src/components/ui/Input.tsx
 241 total
```

### SESUDAH
```
$ wc -l src/pages/Settings/sections/Sync*.tsx src/pages/Settings/sections/useSyncSignIn.ts src/components/ui/Input.tsx
  74 src/pages/Settings/sections/SyncSection.tsx
  57 src/pages/Settings/sections/SyncSignIn.tsx
  74 src/pages/Settings/sections/useSyncSignIn.ts
  59 src/components/ui/Input.tsx
 264 total
```

### lint:emoji
```
$ npm run lint:emoji
> deardiary@1.0.0 lint:emoji
> eslint src --ext .ts,.tsx

EXIT=0
```

### typecheck
```
$ npm run typecheck
> deardiary@1.0.0 typecheck
> tsc --noEmit --pretty false

EXIT=0
```

Catatan: satu run antara sempat melaporkan `src/services/entryFields.ts(81,9): error TS6133:
'deletedAt' is declared but its value is never read.` — file itu di luar scope W2-UI dan sedang
disentuh agent lain; run berikutnya bersih (EXIT=0). Tidak ada error pada file W2-UI.

### gate ready
```
$ grep -n "ready" src/pages/Settings/sections/SyncSection.tsx
22:  const ready = useSyncStore((state) => state.ready);
64:      ) : !ready ? (
```

### emoji check
```
$ grep -nP '[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}]' src/pages/Settings/sections/Sync*.tsx src/pages/Settings/sections/useSyncSignIn.ts src/components/ui/Input.tsx || echo clean
clean
```

### batas baris
- pages (<= 100): SyncSection 74, SyncSignIn 57, useSyncSignIn 74 — OK.
- components (<= 150): Input 59 — OK.

## Handoff

- SYNC-03: W2-AUTH mengekspor `authFailureMessage` di `src/services/supabase/auth.ts`. Saat ini
  helper itu BELUM ada (`grep authFailureMessage src/services/supabase/auth.ts` -> not present).
  Fix W2-UI tidak bergantung padanya (memakai `error.message` langsung), jadi aman. Bila
  signature `authFailureMessage` cocok, integrasi lebih rapi bisa memanggilnya di `run` untuk
  menormalkan pesan sebelum toast — cukup ganti ekspresi di `useSyncSignIn.ts:43`. Jangan edit
  `auth.ts` dari W2-UI.
- Wave 3 menjalankan suite browser (butuh server CSP + dist).

## Temuan P2 di luar scope (TIDAK diperbaiki)

- SYNC-06 — fokus ke input kode (autofocus/refocus saat stage pindah ke 'code').
- SYNC-07 — fokus menu HeaderProfile.
- SYNC-08 — `aria-busy` pada tombol/area saat `busy`/`syncing`.
- SYNC-09 — `pendingCount()` tidak reaktif (dipanggil langsung di render, bukan via store).
- SYNC-10 — copy toggle private.
