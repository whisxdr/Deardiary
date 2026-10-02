# FIX-4 — Aksesibilitas header, drawer, route, label mood

Repo: `D:\.1Kuliah\Coding\Dear dia` · Branch: `fix/repo-audit` · Tanggal: 2026-10-02
Sumber temuan: `reports/audit/E-a11y.md` (E-01, E-02, E-03, E-04)
Sifat: mengubah kode di dalam scope FIX-4 saja. Tidak ada `git` yang dijalankan, tidak ada `npm run build`.

## Ringkasan

Keempat temuan P1 diperbaiki dan diverifikasi ulang dengan probe Playwright terhadap bundle
hasil build. Empat-empatnya gagal sebelum perbaikan dan lolos sesudahnya. Tidak ada dependency
baru. Tidak ada perubahan tata letak: diff geometri elemen antara build sebelum dan sesudah
kosong, dan drawer serta header pixel-identik pada screenshot.

Perubahan menyentuh 5 file, semuanya di dalam scope:

| File | Temuan |
|------|--------|
| `src/components/layout/Header/HeaderLogo.tsx` | E-01 |
| `src/components/layout/Sidebar.tsx` | E-02 |
| `src/app/router.tsx` | E-03 |
| `src/components/layout/AppLayout.tsx` | E-03 |
| `src/components/mood/MoodBadge.tsx` | E-04 |

Tidak ada file di `src/services/**`, `src/store/**`, `src/pages/Write/**`,
`src/components/entry/EntryCard/**`, `scripts/**`, atau `package.json` yang disentuh.
`tailwind.config.js` dan `src/styles/**` tidak diubah: perbaikan kontras cukup dilakukan
dengan token tema yang sudah ada (`text-primary-700`, `dark:text-primary-200`, `ring-accent-gold`).

## Perubahan

### E-01 — Indikator fokus header (`HeaderLogo.tsx:12-20`, `:25`, `:44`)

`focus-visible:outline-none` pada wordmark dihapus, diganti satu konstanta `FOCUS_RING`
yang dipakai wordmark dan ketiga link nav:

```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold
focus-visible:ring-offset-2 focus-visible:ring-offset-primary-700
```

`rounded-md` ditambahkan ke wordmark supaya cincinnya mengikuti bentuk pil seperti kontrol
lain di header. `ring-offset-primary-700` dipakai karena header selalu leather di ketiga tema
(lihat catatan tema di bawah), sehingga pita offset tidak terlihat dan hanya cincin gold
yang muncul.

### E-02 — Drawer sebagai modal (`Sidebar.tsx:22-101`)

Mekanisme disalin dari `src/components/ui/Modal.tsx` (yang sudah benar menurut audit), bukan
memakai `Modal` itu sendiri, supaya tampilan drawer tidak berubah:

- `role="dialog"` + `aria-modal="true"` + `aria-label="Main navigation"` pada wrapper panel.
- `tabIndex={-1}` pada panel, lalu fokus dipindah ke elemen fokusable pertama
  (`(panel.querySelector(FOCUSABLE) ?? panel).focus()`). `autoFocus` pada `NavLink` dihapus:
  atribut itu tidak pernah sampai ke DOM.
- Trap Tab/Shift+Tab di dalam panel. Bila fokus entah bagaimana berada di luar panel
  (mis. setelah klik overlay), Tab berikutnya dipaksa masuk ke item pertama.
- `inert` pada semua saudara panel (`<a>` skip-link, `<header>`, `<main>`, `<footer>`) selama
  drawer terbuka, dan dilepas saat tutup. Efek ini juga yang memulihkan fokus ke tombol
  pemicu.
- Fokus dipulihkan ke elemen yang aktif sebelum drawer dibuka (tombol `Open navigation`).
- `onClose` disimpan di ref: di call site ia arrow inline, jadi identitasnya berubah tiap
  render induk; tanpa ref, efek akan berjalan ulang dan menimpa target pemulihan fokus
  dengan elemen di dalam panel.
- Link di dalam drawer juga diberi cincin gold `focus-visible`, dan tombol gold "New entry"
  memakai `ring-offset-primary-800` supaya cincin gold tidak jatuh di atas latar gold.

### E-03 — Judul dokumen dan fokus per route (`router.tsx:26-95`, `AppLayout.tsx:59-67`)

`RouteBoundary` sekarang memiliki satu efek ber-key `pathname`:

- `document.title` per route: `Entries — DearDiary`, `Calendar — DearDiary`, `Stats — DearDiary`,
  `Settings — DearDiary`, `New entry — DearDiary`, `Edit entry — DearDiary` (pola `/write/:id`),
  `Page not found — DearDiary`. Route `/entry/:id` sengaja dibiarkan `null` karena
  `Reader.tsx:47-52` sudah menyusun judulnya dari nama entri dan efek itu tetap menang.
- Fokus dipindah ke `#main-content` hanya saat pathname berubah, bukan pada render pertama,
  dan dengan `preventScroll: true` supaya pembalikan halaman Reader tidak melompat ke atas.
  Penanda pathname disimpan di scope modul, bukan ref: chunk route yang lazy membuat boundary
  ini suspend ke fallback, sehingga ref per-instance akan lupa route sebelumnya dan melewati
  perpindahan fokus pada route yang justru membutuhkannya.
- Efek ber-key pathname, bukan `location.key`: kotak pencarian header menulis ulang query
  string pada setiap ketikan, dan memfokuskan halaman di tengah pengetikan akan merebut caret.
- `<main>` di `AppLayout` diberi `tabIndex={-1}` (dan `focus:outline-none`) supaya `.focus()`
  benar-benar mendarat, sekaligus memperbaiki nit skip-link dari audit.

Route `/` (Landing) dan `*` (NotFound) tidak punya `#main-content`; efek memeriksa keberadaan
elemen sebelum memanggil `.focus()`, jadi tidak ada error di sana (diverifikasi).

### E-04 — Kontras label mood (`MoodBadge.tsx:12-31`)

`style={{ color }}` dihapus dari elemen pembungkus; warna mood sekarang hanya mengisi ikon
lewat prop `color` ke `MoodIcon`, sementara teks label memakai token tema
`text-primary-700 dark:text-primary-200`. Tidak ada perubahan di `src/constants/moods.ts`
(di luar scope) dan tidak ada perubahan pada titik kalender, chart, atau `MoodOption` yang
memang memakai warna mood untuk elemen non-teks.

## Angka kontras

### Indikator fokus header (butuh >= 3:1, WCAG 2.4.11)

| Kontrol | Sebelum | Sesudah |
|---------|---------|---------|
| Wordmark `DearDiary` | tidak ada indikator sama sekali (outline `rgba(0,0,0,0)`, `box-shadow: none`) | cincin gold `#C9A961` **5.32:1** di atas leather |
| Link `Entries` (aktif) | outline UA `#101010` **2.29:1** | cincin gold **3.69:1** di atas `#614938` |
| Link `Calendar` | outline UA `#101010` **1.59:1** | cincin gold **5.32:1** |
| Link `Stats` | outline UA `#101010` **1.59:1** | cincin gold **5.32:1** |

Per tema (header tetap leather di ketiganya): leather wordmark **5.32:1**, paper **5.32:1**,
night **6.26:1**; link nav terendah **3.69:1** (leather/paper) dan **4.26:1** (night).
Skip-link tidak diubah: outline UA `#101010` di atas gold **8.46:1**.

Link di dalam drawer (latar `#2A1A14`): wordmark **7.43:1**, Entries **5.04:1**,
Calendar/Stats/Settings **7.43:1**, tombol gold "New entry" **7.43:1** (cincin gold di atas
pita offset `primary-800`, bukan di atas gold).

### Label mood 12px (butuh >= 4.5:1, WCAG AA teks kecil)

Warna teks kini identik untuk ke-12 mood, jadi rasionya sama:

| Tema | Sebelum (terburuk) | Sesudah |
|------|--------------------|---------|
| leather | happy **1.63:1**, excited **1.44:1**, 11 dari 12 gagal | **12.17:1** untuk semua 12 — PASS |
| paper | sama, 11 dari 12 gagal | **12.17:1** untuk semua 12 — PASS |
| night | sad **3.44:1**, adoring **3.47:1**, 5 dari 12 gagal | **10.41:1** untuk semua 12 — PASS |

Sebelum (leather, teks = warna mood): happy 1.63, excited 1.44, anxious 2.42, cool 2.64,
calm 2.70, mindblown 2.79, thoughtful 2.95, loved 3.31, angry 3.72, adoring 4.24, sad 4.28,
tired 4.59 (hanya tired lolos). Sesudah: seluruh 12 lolos di ketiga tema.

Catatan: probe menghitung latar efektif dengan mengomposit seluruh lapisan `backgroundColor`
transparan sampai opak, sehingga nilai night (`rgb(42,26,20)`, yaitu `primary-800` tempat
`MoodBadge` berada) berbeda dari angka audit E yang memakai cream.

## Output mentah

### 1. SEBELUM perbaikan

```
$ npm run lint:emoji 2>&1 | tail -3
npm notice run deardiary@1.0.0 lint:emoji
npm notice run eslint src --ext .ts,.tsx
(exit 0)

$ npm run typecheck 2>&1 | tail -3
npm notice run deardiary@1.0.0 typecheck
npm notice run tsc --noEmit --pretty false
(exit 0)
```

Probe terhadap build sumber sebelum perbaikan (`/tmp/fix4-probe/probe.mjs`, server CSP di :5213):

```
=== [BEFORE] E-01 focus indicator, Tab 1-8 on /dashboard (1280px) ===
1. A "Skip to content" bg=rgb(201, 169, 97) indicator=outline 1px rgb(16, 16, 16) ratio=8.46
2. A "DearDiaryEvery page is" bg=rgb(71, 49, 45) indicator=NONE ratio=0
3. A "Entries" bg=rgb(97, 73, 56) indicator=outline 1px rgb(16, 16, 16) ratio=2.29
4. A "Calendar" bg=rgb(71, 49, 45) indicator=outline 1px rgb(16, 16, 16) ratio=1.59
5. A "Stats" bg=rgb(71, 49, 45) indicator=outline 1px rgb(16, 16, 16) ratio=1.59
6. INPUT[Search entries] "" bg=rgb(51, 33, 28) indicator=ring rgb(255, 255, 255) ratio=15.29
7. BUTTON[Account menu] "" bg=rgb(71, 49, 45) indicator=ring rgb(255, 255, 255) ratio=11.97
8. A "New entry" bg=rgb(250, 246, 240) indicator=outline 1px rgb(16, 16, 16) ratio=17.67
E-01 verdict: header logo/nav stops=4 failing=4 -> FAIL

=== [BEFORE] E-02 drawer sidebar as a modal (480x800) ===
drawer after open: {"found":false,"role":null,"ariaModal":null,"ariaLabel":null,"activeTag":"BUTTON","activeText":"","focusInsideDrawer":false,"triggerIsActive":true,"headerInert":false,"mainInert":false,"footerInert":false}
Tab sequence (9 presses): ["OUT:A:DearDiaryEvery","OUT:INPUT:","OUT:BUTTON:","OUT:A:DearDiary","OUT:A:Entries","OUT:A:Calendar","OUT:A:Stats","OUT:A:Settings","OUT:A:New entry"]
after Escape: {"drawerGone":true,"active":"BODY[]:Skip to contentD","headerInert":false,"mainInert":false}
E-02 verdict: {"focusMovedIntoDrawer":false,"dialogRole":false,"backgroundInert":false,"tabTrapped":false,"escapeClosesAndRestores":false,"inertCleared":true} -> FAIL

=== [BEFORE] E-03 document.title + focus per route ===
/dashboard       title="DearDiary — Every page is your story"  active=BODY
/calendar        title="DearDiary — Every page is your story"  active=BODY
/stats           title="DearDiary — Every page is your story"  active=BODY
/settings        title="DearDiary — Every page is your story"  active=BODY
/write           title="DearDiary — Every page is your story"  active=BODY
/entry/m-happy   title="happy day — DearDiary"  active=BODY
/                title="DearDiary — Every page is your story"  active=BODY
/nope            title="DearDiary — Every page is your story"  active=BODY
# in-app navigation (header link click, 1280px) — title and focus after a client-side route change:
after clicking Calendar: {"path":"/calendar","title":"DearDiary — Every page is your story","active":"BODY","activeId":"","activeIsMain":false}
# typing in the header search must NOT steal focus from the input:
after typing "har": {"path":"/dashboard","active":"INPUT","value":"har","title":"DearDiary — Every page is your story"}

=== [BEFORE] E-04 mood label contrast (12px text, needs >= 4.5:1) ===
# theme=leather
  happy       color=rgb(244, 180, 0)   bg=rgb(245, 240, 230) size=12px ratio=1.63 FAIL
  sad         color=rgb(92, 107, 192)  bg=rgb(245, 240, 230) size=12px ratio=4.28 FAIL
  angry       color=rgb(229, 57, 53)   bg=rgb(245, 240, 230) size=12px ratio=3.72 FAIL
  tired       color=rgb(126, 87, 194)  bg=rgb(245, 240, 230) size=12px ratio=4.59 PASS
  thoughtful  color=rgb(120, 144, 156) bg=rgb(245, 240, 230) size=12px ratio=2.95 FAIL
  loved       color=rgb(236, 64, 122)  bg=rgb(245, 240, 230) size=12px ratio=3.31 FAIL
  cool        color=rgb(38, 166, 154)  bg=rgb(245, 240, 230) size=12px ratio=2.64 FAIL
  anxious     color=rgb(255, 112, 67)  bg=rgb(245, 240, 230) size=12px ratio=2.42 FAIL
  excited     color=rgb(255, 193, 7)   bg=rgb(245, 240, 230) size=12px ratio=1.44 FAIL
  calm        color=rgb(138, 154, 91)  bg=rgb(245, 240, 230) size=12px ratio=2.7 FAIL
  adoring     color=rgb(171, 71, 188)  bg=rgb(245, 240, 230) size=12px ratio=4.24 FAIL
  mindblown   color=rgb(255, 87, 34)   bg=rgb(245, 240, 230) size=12px ratio=2.79 FAIL
  theme=leather verdict: FAIL (11 of 12 below 4.5:1)
# theme=paper
  (identik dengan leather)  theme=paper verdict: FAIL (11 of 12 below 4.5:1)
# theme=night
  happy       color=rgb(244, 180, 0)   bg=rgb(42, 26, 20)    size=12px ratio=9.05 PASS
  sad         color=rgb(92, 107, 192)  bg=rgb(42, 26, 20)    size=12px ratio=3.44 FAIL
  angry       color=rgb(229, 57, 53)   bg=rgb(42, 26, 20)    size=12px ratio=3.95 FAIL
  tired       color=rgb(126, 87, 194)  bg=rgb(42, 26, 20)    size=12px ratio=3.21 FAIL
  thoughtful  color=rgb(120, 144, 156) bg=rgb(42, 26, 20)    size=12px ratio=4.99 PASS
  loved       color=rgb(236, 64, 122)  bg=rgb(42, 26, 20)    size=12px ratio=4.44 FAIL
  cool        color=rgb(38, 166, 154)  bg=rgb(42, 26, 20)    size=12px ratio=5.57 PASS
  anxious     color=rgb(255, 112, 67)  bg=rgb(42, 26, 20)    size=12px ratio=6.09 PASS
  excited     color=rgb(255, 193, 7)   bg=rgb(42, 26, 20)    size=12px ratio=10.25 PASS
  calm        color=rgb(138, 154, 91)  bg=rgb(42, 26, 20)    size=12px ratio=5.46 PASS
  adoring     color=rgb(171, 71, 188)  bg=rgb(42, 26, 20)    size=12px ratio=3.47 FAIL
  mindblown   color=rgb(255, 87, 34)   bg=rgb(42, 26, 20)    size=12px ratio=5.28 PASS
  theme=night verdict: FAIL (5 of 12 below 4.5:1)
```

### 2. SESUDAH perbaikan

```
$ npm run lint:emoji 2>&1 | tail -3
npm notice run deardiary@1.0.0 lint:emoji
npm notice run eslint src --ext .ts,.tsx
(exit 0 — tanpa pelanggaran)

$ npm run typecheck 2>&1 | tail -3
npm notice run deardiary@1.0.0 typecheck
npm notice run tsc --noEmit --pretty false
(exit 0 — tanpa error)
```

Probe terhadap build sumber sesudah perbaikan (server CSP di :5214):

```
=== [AFTER] E-01 focus indicator, Tab 1-8 on /dashboard (1280px) ===
1. A "Skip to content" bg=rgb(201, 169, 97) indicator=outline 1px rgb(16, 16, 16) ratio=8.46
2. A "DearDiaryEvery page is" bg=rgb(71, 49, 45) indicator=ring rgb(201, 169, 97) ratio=5.32
3. A "Entries" bg=rgb(97, 73, 56) indicator=ring rgb(201, 169, 97) ratio=3.69
4. A "Calendar" bg=rgb(71, 49, 45) indicator=ring rgb(201, 169, 97) ratio=5.32
5. A "Stats" bg=rgb(71, 49, 45) indicator=ring rgb(201, 169, 97) ratio=5.32
6. INPUT[Search entries] "" bg=rgb(51, 33, 28) indicator=ring rgb(255, 255, 255) ratio=15.29
7. BUTTON[Account menu] "" bg=rgb(71, 49, 45) indicator=ring rgb(255, 255, 255) ratio=11.97
8. A "New entry" bg=rgb(250, 246, 240) indicator=outline 1px rgb(16, 16, 16) ratio=17.67
E-01 verdict: header logo/nav stops=4 failing=0 -> PASS

=== [AFTER] E-02 drawer sidebar as a modal (480x800) ===
drawer after open: {"found":true,"role":"dialog","ariaModal":"true","ariaLabel":"Main navigation","activeTag":"A","activeText":"DearDiary","focusInsideDrawer":true,"triggerIsActive":false,"headerInert":true,"mainInert":true,"footerInert":false}
Tab sequence (9 presses): ["IN:A:Entries","IN:A:Calendar","IN:A:Stats","IN:A:Settings","IN:A:New entry","IN:A:DearDiary","IN:A:Entries","IN:A:Calendar","IN:A:Stats"]
after Escape: {"drawerGone":true,"active":"BUTTON[Open navigation]:","headerInert":false,"mainInert":false}
E-02 verdict: {"focusMovedIntoDrawer":true,"dialogRole":true,"backgroundInert":true,"tabTrapped":true,"escapeClosesAndRestores":true,"inertCleared":true} -> PASS

=== [AFTER] E-03 document.title + focus per route ===
/dashboard       title="Entries — DearDiary"  active=BODY
/calendar        title="Calendar — DearDiary"  active=BODY
/stats           title="Stats — DearDiary"  active=BODY
/settings        title="Settings — DearDiary"  active=BODY
/write           title="New entry — DearDiary"  active=BODY
/entry/m-happy   title="happy day — DearDiary"  active=BODY
/                title="DearDiary — Every page is your story"  active=BODY
/nope            title="Page not found — DearDiary"  active=BODY
# in-app navigation (header link click, 1280px) — title and focus after a client-side route change:
after clicking Calendar: {"path":"/calendar","title":"Calendar — DearDiary","active":"MAIN","activeId":"main-content","activeIsMain":true}
# typing in the header search must NOT steal focus from the input:
after typing "har": {"path":"/dashboard","active":"INPUT","value":"har","title":"Entries — DearDiary"}

=== [AFTER] E-04 mood label contrast (12px text, needs >= 4.5:1) ===
# theme=leather
  happy       color=rgb(62, 39, 35)    bg=rgb(245, 240, 230) size=12px ratio=12.17 PASS
  sad         color=rgb(62, 39, 35)    bg=rgb(245, 240, 230) size=12px ratio=12.17 PASS
  angry       color=rgb(62, 39, 35)    bg=rgb(245, 240, 230) size=12px ratio=12.17 PASS
  tired       color=rgb(62, 39, 35)    bg=rgb(245, 240, 230) size=12px ratio=12.17 PASS
  thoughtful  color=rgb(62, 39, 35)    bg=rgb(245, 240, 230) size=12px ratio=12.17 PASS
  loved       color=rgb(62, 39, 35)    bg=rgb(245, 240, 230) size=12px ratio=12.17 PASS
  cool        color=rgb(62, 39, 35)    bg=rgb(245, 240, 230) size=12px ratio=12.17 PASS
  anxious     color=rgb(62, 39, 35)    bg=rgb(245, 240, 230) size=12px ratio=12.17 PASS
  excited     color=rgb(62, 39, 35)    bg=rgb(245, 240, 230) size=12px ratio=12.17 PASS
  calm        color=rgb(62, 39, 35)    bg=rgb(245, 240, 230) size=12px ratio=12.17 PASS
  adoring     color=rgb(62, 39, 35)    bg=rgb(245, 240, 230) size=12px ratio=12.17 PASS
  mindblown   color=rgb(62, 39, 35)    bg=rgb(245, 240, 230) size=12px ratio=12.17 PASS
  theme=leather verdict: PASS (all 12 >= 4.5:1)
# theme=paper
  (identik dengan leather)  theme=paper verdict: PASS (all 12 >= 4.5:1)
# theme=night
  happy       color=rgb(224, 201, 166) bg=rgb(42, 26, 20)    size=12px ratio=10.41 PASS
  sad         color=rgb(224, 201, 166) bg=rgb(42, 26, 20)    size=12px ratio=10.41 PASS
  angry       color=rgb(224, 201, 166) bg=rgb(42, 26, 20)    size=12px ratio=10.41 PASS
  tired       color=rgb(224, 201, 166) bg=rgb(42, 26, 20)    size=12px ratio=10.41 PASS
  thoughtful  color=rgb(224, 201, 166) bg=rgb(42, 26, 20)    size=12px ratio=10.41 PASS
  loved       color=rgb(224, 201, 166) bg=rgb(42, 26, 20)    size=12px ratio=10.41 PASS
  cool        color=rgb(224, 201, 166) bg=rgb(42, 26, 20)    size=12px ratio=10.41 PASS
  anxious     color=rgb(224, 201, 166) bg=rgb(42, 26, 20)    size=12px ratio=10.41 PASS
  excited     color=rgb(224, 201, 166) bg=rgb(42, 26, 20)    size=12px ratio=10.41 PASS
  calm        color=rgb(224, 201, 166) bg=rgb(42, 26, 20)    size=12px ratio=10.41 PASS
  adoring     color=rgb(224, 201, 166) bg=rgb(42, 26, 20)    size=12px ratio=10.41 PASS
  mindblown   color=rgb(224, 201, 166) bg=rgb(42, 26, 20)    size=12px ratio=10.41 PASS
  theme=night verdict: PASS (all 12 >= 4.5:1)
```

Kontras cincin fokus per tema (probe `probe-ring-themes.mjs`, Tab 2-5):

```
=== theme=leather ===
  Tab 2 "DearDiaryEvery pag" bg=rgb(71, 49, 45) ring=rgb(201, 169, 97) ratio=5.32 PASS
  Tab 3 "Entries" bg=rgb(97, 73, 56) ring=rgb(201, 169, 97) ratio=3.69 PASS
  Tab 4 "Calendar" bg=rgb(71, 49, 45) ring=rgb(201, 169, 97) ratio=5.32 PASS
  Tab 5 "Stats" bg=rgb(71, 49, 45) ring=rgb(201, 169, 97) ratio=5.32 PASS
=== theme=paper ===
  Tab 2 "DearDiaryEvery pag" bg=rgb(71, 49, 45) ring=rgb(201, 169, 97) ratio=5.32 PASS
  Tab 3 "Entries" bg=rgb(97, 73, 56) ring=rgb(201, 169, 97) ratio=3.69 PASS
  Tab 4 "Calendar" bg=rgb(71, 49, 45) ring=rgb(201, 169, 97) ratio=5.32 PASS
  Tab 5 "Stats" bg=rgb(71, 49, 45) ring=rgb(201, 169, 97) ratio=5.32 PASS
=== theme=night ===
  Tab 2 "DearDiaryEvery pag" bg=rgb(60, 38, 34) ring=rgb(201, 169, 97) ratio=6.26 PASS
  Tab 3 "Entries" bg=rgb(88, 64, 46) ring=rgb(201, 169, 97) ratio=4.26 PASS
  Tab 4 "Calendar" bg=rgb(60, 38, 34) ring=rgb(201, 169, 97) ratio=6.26 PASS
  Tab 5 "Stats" bg=rgb(60, 38, 34) ring=rgb(201, 169, 97) ratio=6.26 PASS
```

(Catatan: script tema ini hanya membaca `box-shadow`, jadi Tab 1 skip-link dilaporkan 0.
Skip-link memakai outline UA dan diukur oleh probe utama: 8.46:1 PASS.)

Cincin fokus di dalam drawer (dibuka lewat keyboard, latar `#2A1A14`):

```
=== drawer opened by KEYBOARD (focus-visible applies) ===
  "DearDiary" bg=rgb(42,26,20) visible=true outline=false bestRatio=7.43 PASS
      layers: ["rgba(201,169,97,1) spread=2 ratio=7.43"]
  "Entries" bg=rgb(74,55,35) visible=true outline=false bestRatio=5.04 PASS
      layers: ["rgba(201,169,97,1) spread=2 ratio=5.04"]
  "Calendar" bg=rgb(42,26,20) visible=true outline=false bestRatio=7.43 PASS
  "Stats" bg=rgb(42,26,20) visible=true outline=false bestRatio=7.43 PASS
  "Settings" bg=rgb(42,26,20) visible=true outline=false bestRatio=7.43 PASS
  "New entry" bg=rgb(201,169,97) visible=true outline=false bestRatio=7.43 PASS
      layers: ["rgba(42,26,20,1) spread=2 ratio=7.43","rgba(201,169,97,1) spread=4 ratio=1.00"]
```

### 3. Tidak ada perubahan tata letak

`probe-visual.mjs` membandingkan kotak (x, y, width, height) dari header, logo, nav,
search, main, footer, skip-link, dan setiap link nav pada empat scene
(dashboard 1280px, reader 1280px, dashboard 480px, drawer 480px) antara build sebelum dan
sesudah:

```
=== geometry diff BEFORE vs AFTER ===
NO GEOMETRY DIFFERENCES
```

Screenshot pembanding (di `/tmp`, tidak di repo):
`BEFORE/AFTER-dashboard-1280.png`, `-reader-1280.png`, `-dashboard-480.png`,
`-drawer-480.png`, plus `ring-{leather,paper,night}-{logo,nav}.png`.
Drawer pixel-identik. Reader berbeda hanya pada label mood: teks `Happy` kini ink
`rgb(62,39,35)` sementara ikon matahari tetap `#F4B400`.

### 4. Sweep batas baris

```
$ find src/components -name '*.tsx' | xargs wc -l | awk '$1>150 && $2!="total"'
(empty)

$ find src -name '*.ts*' | xargs wc -l | awk '$1>200 && $2!="total"'
(empty)

$ find src/hooks -name '*.ts' | xargs wc -l | awk '$1>80 && $2!="total"'
(empty)
```

File terbesar yang diubah: `Sidebar.tsx` 145 baris, `router.tsx` 122, `AppLayout.tsx` 72,
`HeaderLogo.tsx` 55, `MoodBadge.tsx` 32.

### 5. Suite regresi milik repo terhadap bundle sesudah perbaikan

```
$ BASE_URL=http://localhost:5214 node scripts/check-features.mjs
PASS  search box shows the typed text at once — "harbour"
PASS  search filters to the matching entry — ok
PASS  clearing search restores every entry
PASS  All-private diary says entries are hidden — "…"
PASS  All-private diary does not claim to be empty
PASS  Malformed privacy settings do not crash the dashboard — "…"
PASS  Dashboard renders entries despite bad settings
PASS  no console errors
ALL PASS

$ BASE_URL=http://localhost:5214 node scripts/smoke-routes.mjs
/            rendered=  170 chars  ok
/dashboard   rendered=  644 chars  ok
/write       rendered=  565 chars  ok
/calendar    rendered=  329 chars  ok
/stats       rendered=  371 chars  ok
/settings    rendered= 1556 chars  ok
no console errors

$ BASE_URL=http://localhost:5214 node scripts/check-composer.mjs
PASS  Missing entry shows the not-found state — editor=false
PASS  Publishing clears the resumed draft
PASS  Leaving mid-edit saves the pending change — " first note. Appended while editing.</p>"
PASS  Stale tab reports the conflict — "…"
PASS  Stale tab does not overwrite the other tab — "<p>Written by the other tab.</p>"
PASS  no console errors
ALL PASS
```

### 6. Risiko yang diuji khusus (addendum)

- **Urutan efek judul Reader vs router.** `/entry/t1` -> `Morning pages — DearDiary`,
  entri tanpa judul -> `Entry — DearDiary`, entri hilang -> `DearDiary`; kembali ke dashboard
  memulihkan `Entries — DearDiary`. Efek router ber-key pathname, efek Reader ber-key `entry`,
  dan efek Reader berjalan setelahnya.
- **Fokus pada route lazy.** Dari `/settings` klik Calendar/Stats/Entries: fokus mendarat di
  `MAIN#main-content` dalam <= 600ms pada ketiganya (sampel t+200ms..t+2000ms).
- **Ketikan pencarian tidak merebut fokus.** Mengetik `har` di kotak pencarian header:
  `active=INPUT`, `value="har"`, judul tetap `Entries — DearDiary` (efek tidak berjalan pada
  perubahan query string).
- **Warna mood tetap aksen.** `svg[stroke="#F4B400"]` pada badge Happy, label `rgb(62,39,35)`.
- **Route tanpa `#main-content`.** `/` dan `/nope`: `hasMainContent=false`, tanpa `pageerror`.
- **`inert` benar-benar memasang.** Anak langsung root layout saat drawer terbuka:
  skip-link `inert=true`, `HEADER true`, panel `false`, `MAIN true`, `FOOTER true`
  (yang benar; `document.querySelector('footer')` pertama di dashboard adalah
  `EntryCardFooter` di dalam `main`, bukan footer halaman).
- **Shift+Tab membungkus.** Dari item pertama (wordmark) Shift+Tab mendarat di "New entry",
  masih di dalam panel.

## Keterbatasan / yang tidak dapat dibuktikan

- Probe memakai Chromium (Playwright 1.63.0) saja. Perilaku `inert` di Safari lama tidak diuji.
- `focus-visible` bergantung pada heuristik peramban; probe membuka drawer lewat keyboard
  supaya heuristik itu berlaku. Pada klik mouse, cincin tidak muncul — perilaku standar
  `focus-visible` dan memang disengaja.
- Rasio kontras dihitung dari nilai `getComputedStyle` dan komposit `backgroundColor`
  bertingkat, bukan dari sampling piksel. Karena warna header/drawer berasal dari token solid
  (bukan gambar), hasilnya setara.
- `MoodOption` (grid 12 tombol di Write) tidak diubah: label 10px di sana sudah memakai
  `text-primary-500 dark:text-primary-300`, bukan warna mood. Ini bukan bagian dari E-04.
- Satu Tab stop `<g tabindex="0">` milik Recharts di `/stats` ditemukan saat probe. Itu
  **sudah ada sebelumnya** (dibuktikan dengan menjalankan urutan yang sama pada build sebelum
  perbaikan) dan berada di luar scope FIX-4; tidak diperbaiki.

## Handoff — TIDAK diperbaiki di FIX-4

**E-05 (kontras teks error 3.72:1).** Tidak dikerjakan. Perbaikannya menuntut perubahan token
`error` di `tailwind.config.js` atau penulisan ulang enam pemakaian `text-error` di
`src/components/ui/Input.tsx`, `Textarea.tsx`, `src/pages/Write/SidebarDetails.tsx`,
`src/pages/Settings/sections/DataSection.tsx`, dan `src/components/editor/TagInput.tsx`.
`src/pages/Write/**` dan `src/components/editor/**` ada di luar scope FIX-4, dan mengubah
token `error` akan menggeser `Button variant="danger"` serta seluruh pesan error di aplikasi —
perubahan lintas halaman yang bukan milik satu temuan ini. Rekomendasi audit (gelapkan ke
`#C62828`, 5.06:1 di cream) valid dan murah, tapi butuh pemilik scope untuk
`tailwind.config.js` + keenam file itu sekaligus.

**E-06 (`<Link><Button>` bersarang di 8 tempat -> Tab stop ganda).** Tidak dikerjakan. Kedelapan
lokasi berada di `src/pages/Dashboard/DashboardHeader.tsx`, `DashboardGrid.tsx`,
`src/pages/Reader/ReaderNav.tsx`, `src/pages/NotFound/NotFound.tsx`,
`src/pages/Calendar/Calendar.tsx`, dan `src/components/calendar/CalendarDayDetail.tsx` —
seluruhnya di luar scope FIX-4 (`src/pages/**` selain kebutuhan judul dokumen, dan
`src/components/calendar/**`). Perbaikannya mekanis (`buttonVariants` sudah diekspor dari
`Button.tsx:42` sehingga `<Link className={buttonVariants(...)}>` bisa langsung dipakai),
tetapi menyentuh enam file di empat direktori berbeda dan setiap penggantian mengubah markup
yang diuji `check-features.mjs`; lebih aman dikerjakan sebagai satu unit tersendiri.

**E-08 (`prefers-reduced-motion` diabaikan `MoodOption` hover + `ComposerModal` stagger).**
Tidak dikerjakan. `MoodOption.tsx` ada di `src/components/mood/**` dan
`ComposerModal.tsx` di `src/components/layout/**` — keduanya di dalam scope file FIX-4, tetapi
temuan ini adalah P2 dan berada di luar empat temuan P1 yang ditugaskan. Perbaikannya satu
baris per file (`useReducedMotion()` dari framer-motion, pola yang sudah dipakai `Modal.tsx:28`),
jadi murah untuk dikerjakan terpisah.

## Artefak

- Probe dan server CSP: `C:\Users\ASUS\AppData\Local\Temp\fix4-probe\` (di luar repo).
  `probe.mjs`, `probe-addendum.mjs`, `probe-ring-themes.mjs`, `probe-shadow-parse.mjs`,
  `probe-visual.mjs`, `probe-focus-lazy.mjs`, `serve.mjs`; output mentah di `before.txt`,
  `after.txt`, `addendum-after.txt`, `focus-lazy.txt`; screenshot di `shots/`.
- Bundle pembanding: `C:\Users\ASUS\AppData\Local\Temp\fix4-before\dist` (sumber sebelum
  perbaikan) dan `fix4-after\dist` (sesudah), keduanya dihasilkan dengan
  `npx vite build --outDir <tmp>` supaya `dist/` di repo tidak tersentuh.
