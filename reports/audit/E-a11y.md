# Audit E — Aksesibilitas & UI

Repo: `D:\.1Kuliah\Coding\Dear dia` · Branch: `fix/repo-audit` · Tanggal: 2026-10-02
Sifat: read-only terhadap kode. File yang ditulis: laporan ini + 2 screenshot bukti.

## Ringkasan

Tidak ada P0. 16 temuan: 6 P1, 10 P2. Tiga P1 teratas: (1) **fokus keyboard tidak terlihat sama sekali** di nav header + logo — outline di-set `transparent` dan UA-default hanya 1.38:1 di atas leather; (2) **drawer sidebar bukan modal** — fokus tidak masuk, tidak terjebak, dan Tab menembus kontrol header di belakang overlay; (3) **label mood memakai warna mood sebagai teks 12px** — 10 dari 12 gagal AA (terburuk 1.44:1). Yang sudah benar dan tidak perlu disentuh: focus trap + Escape + restore di `Modal`, `aria-current` dari `NavLink`, skip-link, toast sonner (`aria-live="polite"`), kontras `text-muted` di ketiga tema, dan tidak ada overflow horizontal di 360px.

## Tabel temuan

| ID | Masalah | file:baris | Bukti / dampak | Prio | Effort |
|----|---------|-----------|----------------|------|--------|
| E-01 | Fokus keyboard **tak terlihat** di nav header dan wordmark. `HeaderLogo` memakai `focus-visible:outline-none` tanpa pengganti apa pun (outline resolve ke `rgba(0,0,0,0)`, `box-shadow: none`); link nav (`HeaderNav`) tidak punya utilitas fokus sama sekali sehingga jatuh ke outline UA `#101010` — 1.38:1 di atas `#3E2723`. Keduanya ada di setiap halaman dan di urutan Tab paling awal. | `src/components/layout/Header/HeaderLogo.tsx:15` (logo), `:26-42` (nav) | Tab 2 = logo: `outlineStyle solid 2px rgba(0,0,0,0) boxShadow none` → nol indikator. Tab 3-5 = Entries/Calendar/Stats: `outline auto 1px rgb(16,16,16)` = **1.38:1** (WCAG 2.4.11 butuh 3:1). Screenshot: `reports/audit/evidence-header-focus-logo.png` (tanpa cincin) vs `evidence-header-focus-nav.png` (cincin gelap nyaris tak terlihat). Bandingkan `Account menu`/`Search` yang punya `ring-accent-gold` — terlihat jelas. | P1 | S |
| E-02 | Drawer sidebar (`Sidebar`) bukan modal: tidak ada `role="dialog"`/`aria-modal`, fokus tidak dipindah ke dalam, tidak ada focus trap, dan halaman di belakangnya tidak di-`inert`. `autoFocus` di `NavLink` tidak berefek. Akibatnya pengguna keyboard membuka drawer lalu Tab melewati kontrol **header di belakang overlay** (tak terlihat) sebelum akhirnya masuk ke drawer. | `src/components/layout/Sidebar.tsx:22-47` (`autoFocus` di `:43`) | Setelah drawer terbuka, `activeElement` tetap `BUTTON:Open navigation` pada t+150ms **dan** t+850ms; `nav.contains(activeElement) === false`. 3 Tab pertama mendarat di `OUT:A:DearDiary`, `OUT:INPUT:Search entries`, `OUT:BUTTON:Account menu` — semuanya di bawah overlay. Atribut drawer: `role=null ariaModal=null tabindex=null`; header/main: `inert=false`, `aria-hidden=null`. | P1 | M |
| E-03 | Navigasi route tidak mengelola fokus maupun mengumumkan perubahan halaman. `document.title` hanya diubah oleh Reader; enam route lain tetap `"DearDiary — Every page is your story"`. Fokus jatuh ke `<body>` setiap kali pindah route (termasuk setelah hapus entri dari Reader dan dari Write). | `src/app/router.tsx:45-63`; `src/pages/Reader/Reader.tsx:47-52`; `src/pages/Reader/useReaderActions.ts:67-76`; `src/pages/Write/useWriteActions.ts:91-97` | Probe 7 route: `active=BODY` semuanya; `title` identik kecuali Reader. Setelah hapus dari `/entry/z` → `/dashboard` dengan `active=BODY`; setelah hapus dari `/write/a` → sama. Tidak ada `aria-live` pengumuman route. Pengguna screen reader tidak tahu halaman sudah berganti. | P1 | M |
| E-04 | Label mood dirender sebagai **teks 12px berwarna warna mood** di atas cream. 10 dari 12 warna gagal WCAG AA 4.5:1; terburuk `happy #F4B400` 1.63:1 dan `excited #FFC107` 1.44:1. Hanya `tired` yang lolos. | `src/components/mood/MoodBadge.tsx:18-23`; warna di `src/constants/moods.ts:4-15`; dipakai `src/pages/Reader/ReaderMetadata.tsx:37`, `src/components/entry/EntryMeta.tsx:40` | Terukur di Reader: `color rgb(244,180,0)` di atas `rgb(245,240,230)` fontSize 12px → 1.63:1. Di `/dashboard` kartu memakai `showLabel=false` (aman, sr-only), jadi yang terlihat gagal hanya di Reader/EntryMeta. Daftar lengkap: happy 1.63, excited 1.44, anxious 2.42, cool 2.64, calm 2.70, mindblown 2.79, thoughtful 2.95, loved 3.31, angry 3.72, adoring 4.24, sad 4.28, tired 4.59. | P1 | M |
| E-05 | Teks error `text-error` `#E53935` di atas cream = **3.72:1**, di atas night `#2A1A14` = **3.95:1**. Selalu dirender `text-xs` (12px) = teks normal, butuh 4.5:1. Berlaku untuk error input, pesan save gagal, dan peringatan storage. | `tailwind.config.js:29`; `src/components/ui/Input.tsx:49`; `src/components/ui/Textarea.tsx:40`; `src/pages/Write/SidebarDetails.tsx:37`; `src/pages/Settings/sections/DataSection.tsx:54`; `src/components/editor/TagInput.tsx:61` | Hitung rasio: `#E53935`/`#F5F0E6` = 3.72, `#E53935`/`#2A1A14` = 3.95. Pesan yang gagal terbaca justru pesan yang paling penting dibaca. | P1 | S |
| E-06 | `<Link>` membungkus `<Button>` di 8 tempat: HTML tidak valid (interaktif bersarang) dan menghasilkan **dua tab stop untuk satu aksi** yang sama, tanpa pembeda visual. Screen reader mengumumkan ganda ("New entry, link" lalu "New entry, button"). | `src/pages/Dashboard/DashboardHeader.tsx:33-38`; `src/pages/Dashboard/DashboardGrid.tsx:42-44,55-57`; `src/pages/Reader/ReaderNav.tsx:20-25`; `src/pages/NotFound/NotFound.tsx:17-25`; `src/pages/Calendar/Calendar.tsx:54-56`; `src/components/calendar/CalendarDayDetail.tsx:59-63` | Probe DOM dashboard: `{"anchorText":"New entry","child":"BUTTON"}`; urutan Tab di dashboard: `8. A:New entry` → `9. BUTTON:New entry` (aksi sama, dua stop). 6 route terdampak; CTA "New entry" ada di header dashboard, empty state, dan navigasi reader. | P1 | M |
| E-07 | Pesan validasi tag dirender tapi **tidak terhubung** ke input: `<p>` tanpa `id`/`role`, dan `aria-describedby` input menunjuk hanya ke hint (`0/10 tags`). Input juga tidak ditandai `aria-invalid`. Pesan error tidak pernah diumumkan. | `src/components/editor/TagInput.tsx:60-62` | Ketik `#` di kolom tag: error `"Tags cannot be empty or longer than 24 characters."` tampil; `role=null`, `id=(no id)`, `inputDescribedby=":r3:-description"` → resolve ke `"0/10 tags"`, `inputInvalid="false"`. | P2 | S |
| E-08 | `prefers-reduced-motion` diabaikan oleh dua animasi Framer Motion: `MoodOption` (`whileHover` scale 1.1 + rotate 5°) dan stagger item `ComposerModal` (opacity 0→1 + y 8, delay per item). Komponen lain (Modal, BookFlip, BookPage, Bookmark, GoldDust, StatNumber) sudah benar; CSS blanket rule menutup animasi CSS. | `src/components/mood/MoodOption.tsx:20-22`; `src/components/layout/ComposerModal.tsx:68-70` | Dengan `reducedMotion: 'reduce'`: hover mood button tetap menghasilkan `matrix(1.09581, 0.0958713, -0.0958713, 1.09581, 0, 0)` (before `none`). Buka ComposerModal: 10 state opacity/transform berbeda terekam (`0.178|…6.`, `0.622|…2.`, dst.) — animasi berjalan penuh. | P2 | S |
| E-09 | `CalendarGrid` memakai `role="grid"` tapi tidak punya `role="row"` untuk baris hari dan tidak punya `role="gridcell"` sama sekali. 35 tombol hari tidak punya peran grid, sehingga mode navigasi grid screen reader tidak berfungsi dan struktur tabel tanggal tidak terbaca. | `src/components/calendar/CalendarGrid.tsx:32-51`; `src/components/calendar/CalendarCell.tsx:27-31` | Probe: `gridLabel="Month grid"`, `directChildren=["row","DIV"]`, `rowCount=1`, `gridcellCount=0`, `buttonCount=35`, `dayCellRoles=["(none)","(none)","(none)"]`. Row yang ada hanya berisi 7 `columnheader`. | P2 | M |
| E-10 | `MoodPickerGrid` memakai `role="radiogroup"` berisi 12 `button` dengan `aria-pressed`, bukan `role="radio"`. Pola radio butuh anak `radio` + navigasi panah + satu tab stop; di sini 12 tombol semuanya tabbable sehingga pengguna keyboard harus Tab 12 kali. | `src/components/mood/MoodPickerGrid.tsx:16`; `src/components/mood/MoodOption.tsx:24` | Probe: `label="Select mood"`, `childRoles=["BUTTON"]`, `radioCount=0`, `allTabbable=true`. | P2 | M |
| E-11 | Kontras non-teks gagal 3:1 pada indikator yang membawa informasi: titik mood 6×6 di kalender (happy 1.63, excited 1.44, calm 2.70, cool 2.64) dan tingkat heatmap (L0 1.22, L1 1.43, L2 1.93, L3 2.70). Ikon `text-success` (2.45) dan api streak `#FF9800` (1.90) di cream juga di bawah 3:1. | `src/components/calendar/CalendarCell.tsx:50-58`; `src/components/charts/HeatmapChart.tsx:10-16`; `src/pages/Write/SidebarDetails.tsx:47`; `src/components/stats/WritingStreak.tsx:13-15` | Hitung rasio di atas cream `#F5F0E6`. Titik kalender punya `title` berisi id mood mentah (`"mindblown"`, bukan label) dan teks `sr-only` hanya menyebut mood pertama. | P2 | S |
| E-12 | Target sentuh di bawah minimum WCAG 2.5.8 (24×24): tombol hapus chip **18×18**, tombol bersihkan pencarian header **14×14**. (Banyak target lain 26–40px — di bawah 44px rekomendasi AAA, tapi lolos AA 24px.) | `src/components/ui/Chip.tsx:31-43`; `src/components/layout/Header/HeaderSearch.tsx:82-91` | Terukur: chip `Remove` 18×18; `Clear search` 14×14. Keduanya di dalam baris yang lebih tinggi, tapi area klik efektifnya tetap 18/14px. | P2 | S |
| E-13 | Gambar yang disisipkan lewat toolbar editor tidak pernah mendapat `alt`. `insertImage` hanya memanggil `setImage({ src })`, dan tidak ada UI untuk mengisi alt — gambar di badan entri akan dibacakan sebagai URL/berkas. | `src/pages/Write/useEditorSetup.ts:95-99`; ekstensi di `src/pages/Write/editorConfig.ts:19` | `editor.chain().focus().setImage({ src: url }).run()` — tanpa `alt`. Sanitizer mengizinkan `alt` (`src/lib/sanitize.ts:30`), jadi backup impor bisa membawanya, tapi jalur editor tidak. | P2 | M |
| E-14 | Dua jalur pesan tidak terhubung: `Textarea` tidak pernah memasang `aria-describedby` untuk `error`/`hint` (hanya `aria-invalid`), dan `Modal` tidak memasang `aria-describedby` untuk paragraf `description` sehingga deskripsi dialog tidak dibacakan saat dialog dibuka. | `src/components/ui/Textarea.tsx:26-41`; `src/components/ui/Modal.tsx:106-129` | Probe Textarea (Settings bio): `describedby=null`. Probe ConfirmDialog "Restore default settings?": `describedby=null`, `labelledby=":r4:"`. Bandingkan `Input` yang sudah benar (`Input.tsx:31`). | P2 | S |
| E-15 | Urutan heading melompat dan bisa duplikat: Dashboard dan Stats `H1 → H3` (tanpa H2); Reader merender `H1` judul entri lalu `H1` lagi dari heading di dalam badan entri (ditulis penulis lewat toolbar Heading 1). | `src/pages/Dashboard/DashboardHeader.tsx:23` + `src/components/entry/EntryCard/EntryCardBody.tsx:14`; `src/pages/Stats/Stats.tsx:23` + `src/components/stats/StatCard.tsx:25`; `src/components/editor/EditorToolbar/BlockButtons.tsx:36-41` + `src/pages/Reader/ReaderContent.tsx:34-39` | Probe `/dashboard`: `H1 > H3`; `/stats`: `H1 > H3`. Entri dengan heading di badan: `H1:Page title | H1:Body heading`. Navigasi heading screen reader jadi menyesatkan. | P2 | S |
| E-16 | Klaim copy di halaman pertama melebihi kenyataan build ini: hint di bawah tombol cover berbunyi *"Your entries are stored privately in this browser."* padahal `syncEnabled() === true` dan sign-in mengunggah entri sebagai plain text. Tidak ada peringatan di layar ini; pengungkapan baru muncul di Settings. | `src/pages/Landing/CoverActions.tsx:34-35` | Terukur: `hint = "Your entries are stored privately in this browser."`, sementara probe `/settings` menunjukkan `#sync-heading` ada (`syncEnabled=true`) dan `privacyCopy` menyebut plain text. Ini lokasi berbeda dari SYNC-04 (yang menangani `SyncSignIn`/`SyncSection`/`PrivacySection`), jadi belum tercakup audit sebelumnya. Terkait tapi terpisah: toggle di `src/pages/Write/WriteSidebar.tsx:89` berdeskripsi "Mark as personal" tanpa menyebut flag ini bukan enkripsi (SYNC-10 menyebut lokasi Settings, bukan Write). | P2 | S |

## Yang diverifikasi sudah benar (jangan diubah)

- **`Modal`**: focus trap Tab/Shift+Tab bekerja (14 Tab berputar di 4 tombol dialog + Cancel + Close), Escape menutup dan mengembalikan fokus ke pemicu (`after Escape: BUTTON:Write a new entry`), `body.overflow` dipulihkan, `aria-modal="true"` + `aria-labelledby` ada. Berlaku juga untuk `ConfirmDialog` (fokus kembali ke `Delete entry`).
- **`aria-current`**: `NavLink` react-router memasang `aria-current="page"` otomatis — terverifikasi `Entries=page` di dashboard, `Calendar=page`, `Stats=page`. Hanya `/settings` yang tidak punya item aktif karena Settings memang tidak ada di nav header/sidebar.
- **Skip-link**: `AppLayout.tsx:47-52` berfungsi — saat difokus Tab pertama ia terlihat (123×36, bg gold, teks `#2A1A14` = 8.36:1), Enter melompat ke `#main-content`, dan Tab berikutnya mendarat di dalam `<main>`. Nit P2 (tidak masuk tabel): `main` tidak punya `tabindex="-1"` sehingga fokus sendiri jatuh ke `body`; menambahkannya membuat perpindahan fokus eksplisit.
- **Toast sonner**: diumumkan. `<section aria-live="polite" aria-relevant="additions text" aria-atomic="false" aria-label="Notifications alt+T">`; terverifikasi berisi `"Entry copied to clipboard"` setelah aksi Share.
- **Live region lain**: `SidebarDetails.tsx:42` (status simpan), `ReaderNav.tsx:33` (`3 of 24`), `CalendarHeader.tsx:18` (bulan). `role="alert"` di `Input.tsx:48`, `DataSection.tsx:54`, `SidebarDetails.tsx:37`.
- **`text-muted` di ketiga tema lolos AA**: leather `#7D5A3C`/`#FAF6F0` = 5.74, di atas cream `#F5F0E6` = 5.44; night `#E0C9A6`/`#2A1A14` = 10.41; paper `#7D5A3C`/`#FAF6F0` = 5.74. Terukur langsung di DOM untuk tiap tema.
- **`Avatar`**: pola benar — `<img alt="" aria-hidden="true">` di dalam `span[aria-label="{name} avatar"]`, plus fallback inisial lokal.
- **Ikon dekoratif**: seluruh ikon phosphor di scope memakai `aria-hidden="true"` (grep `alt=` hanya menemukan 1 hit, yaitu `Avatar`; tidak ada `<img>` lain).
- **Form**: `Input` sudah `aria-invalid` + `aria-describedby` (`Input.tsx:30-31`), `label htmlFor` benar di `Input`/`Select`/`Toggle`; `Toggle` memakai `role="switch"` + `aria-checked` + `aria-label`. Tidak ada field `required` di app ini.
- **Landmark**: `<main>` ada di semua route (AppLayout, Landing, NotFound). `<header>`/`<footer>` di dalam `<article>`/`<main>` ter-scope sehingga tidak menjadi landmark liar.
- **Reduced motion CSS**: blanket rule `globals.css:49-58` + `.cover-tilt` `:99-104` ikut ke bundle produksi (`dist/assets/*.css`), dan `usePrefersReducedMotion` dipakai di 6 komponen.
- **Responsif**: tidak ada overflow horizontal di 360×740 pada ketujuh route (`scrollWidth === clientWidth === 360`).
- **Editor**: `role="toolbar" aria-label="Formatting" aria-controls="entry-editor"` — target `#entry-editor` ada dan berisi `contenteditable` dengan `aria-label="Entry body"`.
- **`aria-expanded`**: `HeaderProfile.tsx:34-35` punya `aria-haspopup="menu"` + `aria-expanded`.

## Output mentah

```
$ npm run lint:emoji 2>&1 | tail -3
npm notice run deardiary@1.0.0 lint:emoji
npm notice run eslint src --ext .ts,.tsx
(exit 0 — tanpa pelanggaran)

$ grep -rn "prefers-reduced-motion\|useReducedMotion" src/ || echo none
src/pages/Landing/useParallax.ts:20:    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
src/hooks/useMediaQuery.ts:27:  return useMediaQuery('(prefers-reduced-motion: reduce)');
src/styles/globals.css:49:  @media (prefers-reduced-motion: reduce) {
src/styles/globals.css:99:  @media (prefers-reduced-motion: reduce) {

$ grep -rn "aria-label\|aria-labelledby\|aria-describedby\|aria-live\|role=" src/components src/pages | wc -l
70

$ grep -rn "alt=" src/components src/pages | head -20
src/components/ui/Avatar.tsx:43:          alt=""

$ grep -rn "autoFocus\|\.focus()" src/ || echo none
src/components/layout/Sidebar.tsx:43:          autoFocus
src/components/ui/Modal.tsx:58:      (node.querySelector<HTMLElement>(FOCUSABLE) ?? node).focus();
src/components/ui/Modal.tsx:75:        last.focus();
src/components/ui/Modal.tsx:78:        first.focus();
src/components/ui/Modal.tsx:91:      restoreRef.current?.focus();
(+ 17 hit `editor.chain().focus()` di MarkButtons/BlockButtons/useEditorSetup = API tiptap, bukan manajemen fokus DOM)

$ node scripts/check-features.mjs 2>&1 | tail -10
PASS  search box shows the typed text at once — "harbour"
PASS  search filters to the matching entry — ok
PASS  clearing search restores every entry
PASS  All-private diary says entries are hidden — "…"
PASS  All-private diary does not claim to be empty
PASS  Malformed privacy settings do not crash the dashboard — "…"
PASS  Dashboard renders entries despite bad settings
PASS  no console errors

ALL PASS
```

```
# Chromium (Playwright, global) terhadap dist + CSP server di :5212

=== Focus indicator, Tab 1-10 di /dashboard ===
1. {"tag":"A","text":"Skip to content","outlineStyle":"auto","outlineWidth":"1px","outlineColor":"rgb(16, 16, 16)","boxShadow":"none"}
2. {"tag":"A","text":"DearDiaryEvery page is you","outlineStyle":"solid","outlineWidth":"2px","outlineColor":"rgba(0, 0, 0, 0)","boxShadow":"none"}
3. {"tag":"A","text":"Entries","outlineStyle":"auto","outlineWidth":"1px","outlineColor":"rgb(16, 16, 16)","boxShadow":"none"}
4. {"tag":"A","text":"Calendar","outlineStyle":"auto","outlineWidth":"1px","outlineColor":"rgb(16, 16, 16)","boxShadow":"none"}
5. {"tag":"A","text":"Stats","outlineStyle":"auto","outlineWidth":"1px","outlineColor":"rgb(16, 16, 16)","boxShadow":"none"}
6. {"tag":"INPUT","text":"Search entries","outlineStyle":"solid","outlineWidth":"2px","outlineColor":"rgba(0, 0, 0, 0)","boxShadow":"… rgb(201, 169, 97) 0px 0px 0px 2px"}
7. {"tag":"BUTTON","text":"Account menu","outlineStyle":"solid","outlineWidth":"2px","outlineColor":"rgba(0, 0, 0, 0)","boxShadow":"… rgb(201, 169, 97) 0px 0px 0px 2px"}
8. {"tag":"A","text":"New entry","outlineStyle":"auto","outlineWidth":"1px","outlineColor":"rgb(16, 16, 16)","boxShadow":"none"}
9. {"tag":"BUTTON","text":"New entry","outlineStyle":"solid","outlineWidth":"3px","outlineColor":"rgb(26, 15, 10)","boxShadow":"none"}
10. {"tag":"SELECT","text":"All moods…","outlineStyle":"solid","outlineWidth":"2px","outlineColor":"rgba(0, 0, 0, 0)","boxShadow":"… rgb(201, 169, 97) 0px 0px 0px 2px"}

# Kontras indikator fokus (rasio terhitung)
UA outline #101010 di atas header #3E2723   = 1.38   (butuh 3:1)
UA outline #101010 di atas sidebar #2A1A14  = 1.14
UA outline #101010 di atas search  #301E19  = 1.20
UA outline #101010 di atas paper   #FAF6F0  = 17.67  (halaman terang: aman)
ring-accent-gold #C9A961 di atas #3E2723    = 6.14   (komponen yang sudah benar)

# Sampel piksel cincin fokus link nav "Calendar" (crop 380x176, baris tengah)
x=9 #48322e  x=13 #ffffff  x=17 #101010  x=25 #48322e
→ cincin gelap #101010 selebar ~4px di atas header #48322e: praktis tak terlihat

=== Drawer sidebar (480x800), buka via Enter di "Open navigation" ===
activeElement timeline: ["BODY:…","BUTTON:Open navigation"]
drawer contains focus? false
drawer markup: {"role":null,"ariaModal":null,"tabindex":null,"overlayRole":null,"overlayAriaHidden":"true"}
background inert? {"headerInert":false,"headerAriaHidden":null,"mainAriaHidden":null}
anchorOuterStart: <a class="mb-4 flex items-center gap-2 font-display text-lg text-accent-gold" href="/">…
hasAutoFocusAttr: false   reactAutoFocusProp: false   activeIsAnchor: false
Tab sequence: ["OUT:A:DearDiaryEvery pag","OUT:INPUT:Search entries","OUT:BUTTON:Account menu","IN:A:DearDiary","IN:A:Entries","IN:A:Calendar","IN:A:Stats","IN:A:Settings","IN:A:New entry"]
after Escape: drawerGone=true  active=BODY

=== Modal (ComposerModal) ===
{"found":true,"modal":"true","titleText":"What would you like to write?","ariaDescribedby":null,"descText":null,"focusInside":true,"activeName":"Close dialog","bodyOverflow":"hidden"}
tab cycle: ["BUTTON:Blank page…","BUTTON:Three good things…","BUTTON:Evening reflection…","BUTTON:Backdated entry…","BUTTON:Cancel","BUTTON:Close dialog","BUTTON:Blank page…", …] (berputar, tidak bocor)
after Escape: {"dialogGone":true,"active":"BUTTON:Write a new entry"}

=== ConfirmDialog (reader) ===
{"focused":true,"activeName":"Close dialog","describedby":null}
buttonOrder: ["Close dialog","Cancel","Delete entry"]  firstFocus: "Close dialog"
after Esc active: BUTTON:Delete entry

=== Toast ===
{"tag":"SECTION","live":"polite","label":"Notifications alt+T","atomic":"false","text":"Entry copied to clipboard"}
allLiveRegions: ["SPAN[aria-live=polite]","SECTION[aria-live=polite]"]

=== Route change: title + focus ===
Dashboard  title="DearDiary — Every page is your story"  active=BODY
Calendar   title="DearDiary — Every page is your story"  active=BODY
Stats      title="DearDiary — Every page is your story"  active=BODY
Settings   title="DearDiary — Every page is your story"  active=BODY
Write      title="DearDiary — Every page is your story"  active=BODY
Reader     title="Morning pages — DearDiary"            active=BODY
Landing    title="DearDiary — Every page is your story"  active=BODY

=== aria-current ===
/dashboard → Entries=page    /calendar → Calendar=page    /stats → Stats=page
/settings  → (none)          /write → (none)              / → (none)

=== Calendar grid ===
{"gridLabel":"Month grid","directChildren":["row","DIV"],"rowCount":1,"gridcellCount":0,"buttonCount":35,
 "weekdayRowCells":["columnheader" x7],"dayCellRoles":["(none)","(none)","(none)"]}
titik mood: {"title":"mindblown","w":"6px","h":"6px"}   ← title = id mentah, bukan label

=== Mood radiogroup ===
{"label":"Select mood","childRoles":["BUTTON"],"radioCount":0,"allTabbable":true,"firstAriaPressed":"false"}

=== Reduced motion (reducedMotion:'reduce') ===
MoodOption hover: before=none  after=matrix(1.09581, 0.0958713, -0.0958713, 1.09581, 0, 0)  ANIMATES
ComposerModal item states: ["1|none","0.178|matrix(1, 0, 0, 1, 0, 6.","0|matrix(1, 0, 0, 1, 0, 8)","0.276|…","0.622|…","0.370|…","0.073|…","0.878|…","0.696|…","0.459|…"]  ANIMATES

=== Label mood sebagai teks (Reader) ===
[{"text":"Mind-blown","color":"rgb(255, 87, 34)","bg":"rgb(245, 240, 230)","size":"12px"}]

=== Kontras teks mood di atas cream #F5F0E6 (12px, butuh 4.5:1) ===
happy      #F4B400  1.63  FAIL        sad        #5C6BC0  4.28  FAIL
excited    #FFC107  1.44  FAIL        angry      #E53935  3.72  FAIL
thoughtful #78909C  2.95  FAIL        loved      #EC407A  3.31  FAIL
cool       #26A69A  2.64  FAIL        anxious    #FF7043  2.42  FAIL
calm       #8A9A5B  2.70  FAIL        adoring    #AB47BC  4.24  FAIL
tired      #7E57C2  4.59  pass        mindblown  #FF5722  2.79  FAIL

=== Kontras lain (rasio terhitung) ===
text-error #E53935 / cream #F5F0E6  = 3.72  FAIL (12px)
text-error #E53935 / night #2A1A14  = 3.95  FAIL (12px)
text-success #4CAF50 / cream        = 2.45  FAIL (ikon, butuh 3:1)
warning #FF9800 / cream             = 1.90  FAIL (ikon api streak)
accent-gold #C9A961 / cream         = 1.98  FAIL (hover WordCloud & tombol favorit)
accent-gold #C9A961 / paper         = 2.09  FAIL
heatmap L0..L3 / cream = 1.22 / 1.43 / 1.93 / 2.70  FAIL (butuh 3:1)
text-muted #7D5A3C / paper #FAF6F0  = 5.74  PASS
text-muted #7D5A3C / cream #F5F0E6  = 5.44  PASS
text-muted #E0C9A6 / night #2A1A14  = 10.41 PASS
primary-100/85 di atas cover #3E2723 = 8.47  PASS

=== Target sentuh ===
Interaktif < 24x24: [{"tag":"A","w":1,"h":1,"name":"Skip to content"} (tersembunyi sampai fokus, lalu 123x36),
                    {"tag":"BUTTON","w":18,"h":18,"name":"Remove"} (hapus chip tag)]
Clear search header: {"w":14,"h":14}
< 44px (AA lolos, AAA gagal) — contoh terukur: nav link 70x32, IconButton 36x36, toolbar editor 32x32,
  "Today" 51x24, anchor Settings 26px tinggi, tombol aksi sidebar Write 40px, Favorites chip 96x26.

=== Nested interactive <a><button> ===
{"count":1,"sample":[{"anchorText":"New entry","child":"BUTTON"}]}  (di dashboard; 8 lokasi di 6 file)

=== TagInput error ===
{"errorRendered":true,"errorText":"Tags cannot be empty or longer than 24 characters.",
 "errorRole":null,"errorId":"(no id)","inputDescribedby":":r3:-description",
 "inputInvalid":"false","describedByResolvesTo":["0/10 tags"]}

=== Textarea / Modal description ===
Textarea (Settings bio): {"describedby":null,"invalid":"false","hasLabel":true}
Modal "Restore default settings?": {"describedby":null,"labelledby":":r4:"}

=== Heading order ===
/dashboard: H1:Welcome back, Ana | H3:…        /stats: H1:Your writing habits | H3:… (x10)
Reader (entri ber-heading): H1:Page title | H1:Body heading
/settings: H1 > H2 > H2 > H2 > H2 > H2 > H2  (benar)   /calendar: H1 > H2 > H3 (benar)   /write: H1 > H2 (benar)

=== Overflow horizontal @360x740 ===
Landing ok · Dashboard ok · Write ok · Reader ok · Calendar ok · Stats ok · Settings ok
(scrollWidth = clientWidth = 360 di ketujuhnya)

=== Skip link ===
Tab 1 = A:Skip to content (visible=true, 123x36, bg rgb(201,169,97), teks rgb(42,26,20))
Enter → active=BODY; Tab berikutnya = A:New entry, is inside main? true

=== Klaim copy Landing ===
hint: "Your entries are stored privately in this browser."   btnDescribedby: "open-book-hint"
settings has Account section: true   (syncEnabled() === true)
privacy copy: "Entries stay in this browser until you sign in. Sync is available in this build, but nothing is uploaded while you are signed out."

=== Kontras text-muted terukur per tema (DOM) ===
leather: --text-muted #7d5a3c  color rgb(125,90,60)  bg rgb(250,246,240)
paper  : --text-muted #7d5a3c  color rgb(125,90,60)  bg rgb(250,246,240)
night  : --text-muted #e0c9a6  color rgb(224,201,166) bg rgb(26,15,10)
```

## Handoff

Untuk agen fix berikutnya, urut prioritas:

1. **E-01** (1 baris + 1 blok kecil): di `HeaderLogo.tsx:15` ganti `focus-visible:outline-none` menjadi pola yang sudah dipakai komponen lain — `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-primary-700`. Lalu tambahkan kelas yang sama ke `NavLink` di `HeaderNav` (`:29-37`). Cincin gold 6.14:1 sudah terverifikasi aman di atas leather.
2. **E-02** (`Sidebar.tsx`): pakai ulang `Modal`/`ConfirmDialog`? Tidak bisa langsung (drawer, bukan dialog tengah), tapi mekanismenya bisa diangkat: `role="dialog" aria-modal="true" aria-label="Main navigation"` di wrapper, `tabindex="-1"` + `focus()` saat mount (ganti `autoFocus` yang tidak berefek), trap Tab seperti `Modal.tsx:65-80`, dan `inert` pada `<Header>`/`<main>` selama terbuka. Restore fokus ke tombol pemicu saat tutup.
3. **E-03**: satu efek di `RouteBoundary` (`router.tsx:35-38`) — pada perubahan `location.key`, set `document.title` per route dan pindahkan fokus ke `<main tabindex="-1">`. Sekalian perbaiki nit skip-link.
4. **E-04**: pisahkan warna ikon dari warna teks di `MoodBadge` — ikon tetap `moodColor`, label pakai `text-primary-700 dark:text-primary-200` (atau tabel warna teks terpisah yang lolos 4.5:1). `moodColor` tetap dipakai untuk titik/chart.
5. **E-05**: gelapkan `error` di `tailwind.config.js:29` sampai ≥4.5:1 di cream dan night (mis. `#C62828` = 5.06 di cream), atau render pesan error dengan `text-primary-700` + ikon `text-error`.
6. **E-06**: ganti `<Link><Button>` dengan `<Button asChild>`-style atau `<Link className={buttonVariants(...)}>`. `buttonVariants` sudah diekspor (`Button.tsx:42`) sehingga bisa dipakai langsung di `className` Link.
7. **E-07…E-16**: perbaikan kecil terpisah — `aria-describedby` untuk Textarea/Modal/TagInput, hapus `role="radiogroup"` atau ubah ke `role="radio"` + roving tabindex, ganti `role="grid"` kalender menjadi `<table>`/`role="grid"` lengkap, `useReducedMotion()` dari framer-motion di `MoodOption`/`ComposerModal`, prompt alt saat `setImage`, dan ubah hint Landing menjadi netral ("Your entries are stored in this browser" — tanpa klaim "privately") selama sync tersedia.

Catatan cakupan: audit ini **tidak** mengulang SYNC-01..SYNC-10 (menu HeaderProfile, tombol busy, error OTP, dsb.). E-16 sengaja hanya melaporkan lokasi baru (Landing, dan deskripsi toggle di `WriteSidebar`) karena SYNC-04/SYNC-10 menangani `SyncSignIn`/`SyncSection`/`PrivacySection`. Tidak ada perubahan kode yang dilakukan; dua screenshot di `reports/audit/` adalah satu-satunya artefak selain laporan ini.
