# next-B — Correctness sisa (verifikasi ulang)

Repo: `D:\.1Kuliah\Coding\Dear dia`. Branch: `main` @ `3e37cc3`. Tanggal: 2026-10-05.
Serve: `node scripts/serve-with-csp.mjs 5212`. Probe: Playwright terhadap bundle produksi segar. Read-only.

## Ringkasan

Empat temuan P2 yang belum disentuh semuanya masih ada dan terverifikasi dengan probe nyata. B-05 (toast sukses padahal write gagal) dan B-04 (import menimpa entri lebih baru tanpa konfirmasi) adalah dua yang paling berdampak: keduanya memberi tahu pengguna sesuatu yang tidak benar atau memundurkan data tanpa dialog. B-12 salah secara faktual di UI. B-07 bukan bug, hanya invariant tanpa peringatan.

## Tabel temuan (status SEKARANG)

| ID | Masalah | file:baris | Bukti probe | Status | P | Effort |
|---|---|---|---|---|---|---|
| B-04 | Import backup menimpa entri lokal yang lebih baru tanpa konfirmasi/stamp check | `src/pages/Settings/sections/DataSection.tsx:36-42`, `src/services/importService.ts:34` | Lokal `legacy-1` `updatedAt=2026-09-30`; import backup id sama `updatedAt=2024-01-01` -> disk berisi `OLDER backup / 2024-01-01`, **dialog=0** | MASIH ADA | P2 | S |
| B-05 | "Clear all entries" + import toast sukses padahal write gagal (quota) | `src/pages/Settings/sections/DataSection.tsx:88-93` (hasil `deleteAllEntries()` dibuang), `:39` (hasil `replaceAll` dibuang) | `setItem` melempar untuk key `entries` -> toast `["All entries removed"]`, disk masih `["One","Two"]` | MASIH ADA | P2 | S |
| B-07 | Draft autosave tidak masuk `entries`, tidak ikut backup, tanpa peringatan di Data section | `src/pages/Write/useWriteActions.ts:57-61`, `src/services/exportService.ts:58-67` | `exportBackup` hanya menerima `entries`; `grep draft DataSection` -> hanya `removeKey` (baris 91). Tidak ada teks yang menyebut draft tidak termasuk backup | MASIH ADA (invariant, bukan bug) | P2 | S |
| B-12 | `estimateUsage()` hanya dihitung ulang saat `entries.length` berubah | `src/pages/Settings/sections/DataSection.tsx:22-25` (`useMemo(..., [entries.length])`) | Draft 50 KB ditulis tanpa mengubah jumlah entri -> label tetap `Using about 269 B ... for 1 entry.` (stale) | MASIH ADA | P2 | S |

## Output mentah

```
=== B-05 clear-all with setItem throwing ===
toasts: ["All entries removed"]
disk still holds entries: [ 'One', 'Two' ]

=== B-04 import older backup over newer local ===
after import: [ 'OLDER backup / 2024-01-01T10:00:00.000Z' ]
dialogs shown: 0

=== B-12 estimateUsage after draft grows ===
before draft: Using about 269 B of browser storage for 1 entry.
after 50KB draft (no entry-count change): Using about 269 B of browser storage for 1 entry.
stale? true

=== B-07 ===
exportService.exportBackup -> payload { entries, settings } (no draft)
DataSection: grep "draft" -> only line 91 removeKey(STORAGE_KEYS.draft)
```

## Rencana perbaikan (Wave B2)

- **B-05** — periksa nilai balik `deleteAllEntries()` dan `replaceAll()`; ganti `toast.success` tanpa syarat dengan `reportWrite(...)` pola `saveError.ts:33` (sukses hanya bila `saved === true`). Scope file: `DataSection.tsx`.
- **B-04** — di `handleImport`, sebelum `replaceAll`, hitung berapa entri lokal yang `updatedAt` lebih baru dari yang diimpor; bila ada, tampilkan `ConfirmDialog` "N entri lokal lebih baru akan ditimpa" sebelum menerapkan. Bandingkan stamp dengan `new Date(...).getTime()` seperti `replaceEntries`. Scope: `DataSection.tsx` (+ mungkin `importService.ts` bila logika ditaruh di sana).
- **B-12** — perbaiki dependency `useMemo` agar ikut menghitung ulang saat draft/settings berubah, atau hitung ulang `estimateUsage()` saat mount + saat write. Scope: `DataSection.tsx`.
- **B-07** — rekomendasi saja: tambah satu baris di Data section yang menyatakan draft yang belum dipublish tidak termasuk backup, ATAU sertakan draft ke `exportBackup`. Jangan terapkan tanpa keputusan (invariant).

## Risiko & rollback

- B-04: menambah dialog konfirmasi mengubah alur import; pastikan import yang tidak menimpa apa pun tetap langsung jalan (tanpa dialog) agar tidak mengganggu. Rollback = kembalikan `handleImport` versi lama.
- B-05: `reportWrite` mengubah pesan toast; cek agar sukses normal tetap menampilkan pesan sukses. Rollback = kembalikan `toast.success`.
- B-12: perubahan dependency `useMemo` murah; risiko = menghitung ulang terlalu sering (estimateUsage memindai semua key). Bila khawatir, hitung ulang hanya saat draft berubah.
