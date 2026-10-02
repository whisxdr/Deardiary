# Audit A — Security (OWASP-style)

Repo: `D:\.1Kuliah\Coding\Dear dia` · Branch: `fix/repo-audit` · Tanggal: 2026-10-02
Sifat: read-only terhadap kode. Satu file ditulis: laporan ini.

## Ringkasan

Tidak ada P0. Satu P1 nyata: `ALLOWED_URI_REGEXP` di `src/lib/sanitize.ts` menimpa validator URI internal DOMPurify, sehingga `target` dan `rel` dibuang dari setiap `<a>` — kontrol "paksa `rel=noopener`" adalah dead code dan komentarnya menyesatkan. Sisanya P2: project ref nyata di satu file tracked, kerentanan dependency yang mayoritas dev-only atau tidak reachable, dan beberapa pengerasan. Secrets bersih: tidak ada key/token tracked maupun di git history; `.env.local` benar hanya lokal dan gitignored. CSP identik byte-per-byte di 3 tempat, lolos parity check, dan terverifikasi live. RLS + RPC `upsert_entries` sudah benar: tidak ada jalur menulis baris atas nama user lain.

## Tabel temuan

| ID | Masalah | file:baris | Bukti / dampak | Prio | Effort |
|----|---------|-----------|----------------|------|--------|
| A-01 | `ALLOWED_URI_REGEXP` kustom menimpa `IS_ALLOWED_URI` internal DOMPurify, yang dipakai untuk **semua** atribut — bukan hanya `href`/`src`. `target` dan `rel` bukan anggota `URI_SAFE_ATTRIBUTES`, dan nilainya (`_blank`, `noopener noreferrer`) tidak cocok regex `^(?:https?\|mailto\|tel\|data:image\/)`, jadi keduanya dibuang dari setiap link. Blok "paksa `rel=noopener noreferrer`" (baris 50–52) tidak pernah cocok karena `target` sudah hilang lebih dulu. | `src/lib/sanitize.ts:33` (regex), `:49` (sanitize), `:50-52` (replace yang jadi dead code) | Repro Chromium + DOMPurify 3.4.16, config persis dari file: `<a href="https://x" target="_blank">l</a>` → `<a href="https://x">l</a>`. Tanpa `ALLOWED_URI_REGEXP` → `target` dan `rel` bertahan. Dampak keamanan **sekarang nol** (tanpa `_blank` tidak ada `window.opener` leak), tapi: (a) kontrol keamanan yang didokumentasikan tidak berjalan, (b) tiptap `Link` default-nya `target="_blank" rel="noopener noreferrer nofollow"` (terverifikasi di `node_modules/@tiptap/extension-link/dist/index.js:253-257`), jadi setiap link yang dibuat user kehilangan target dan nofollow saat round-trip simpan→baca. Regex rel juga rapuh: gagal kalau ada `>` mentah di nilai atribut sebelumnya (`<a title="a > b" target="_blank" ...>` → `false`); tidak reachable hari ini hanya karena DOMPurify men-serialize `>` menjadi `&gt;`. | P1 | S |
| A-02 | Project ref Supabase nyata tertulis di file tracked. | `reports/apply/swarm-prompt-pack.md:6`, `:16`, `:173` | `<project-ref>` (literal di-redaksi di laporan ini) = identitas backend (`https://<project-ref>.supabase.co`). Anon key **tidak** ada di tracked/history. Ref saja bernilai rendah (butuh anon key, dan RLS sudah menutup data), tapi tidak perlu ada di repo publik. | P2 | S |
| A-03 | `vite` 5.4.21 rentan (satu-satunya HIGH di `npm audit`). | `package.json` devDependencies; terpasang `node_modules/vite` 5.4.21 | 3 advisory: path traversal pada penanganan `.map` optimized deps, bypass `server.fs.deny` lewat alternate path Windows, dan NTLMv2 hash disclosure via UNC path (launch-editor). **Hanya dev server** — tidak ikut ke bundle produksi. Relevan karena development dilakukan di Windows, platform yang disasar dua advisory terakhir. Fix butuh Vite 8 (major, breaking). | P2 | M |
| A-04 | `@tiptap/*` 2.27.3 rentan prototype pollution; **tidak ada patch di jalur 2.x**. | `package.json`; `node_modules/@tiptap/core` 2.27.3 | GHSA-cp6q-959q-f8rh — `mergeAttributes()` mengubah key `__proto__` milik sendiri menjadi atribut DOM warisan yang executable. Range `<=3.30.3`; versi terbaru 2.x adalah 2.27.3 (sudah dikonfirmasi lewat `npm view`), jadi fix hanya lewat migrasi ke 3.31.4 (major). Tidak reachable di app ini: nama atribut ditentukan oleh definisi extension tiptap, bukan diambil dari HTML user; `parseHTML` hanya membaca `href`/`src` spesifik. | P2 | L |
| A-05 | `react-router` / `react-router-dom` 6.30.6 — open redirect via backslash di `<Link>`/`useNavigate`, dan arbitrary constructor injection pada SSR hydration. | `package.json` | App client-only (tanpa SSR) dan tidak ada tujuan navigasi yang dikendalikan user: semua `navigate()` memakai konstanta `ROUTES.*` atau `ROUTES.reader(target.id)` dengan `target` dari daftar entri lokal. Path selalu berawalan `/entry/`, jadi tidak bisa menjadi protocol-relative. Tidak eksploitatif di sini. | P2 | M |
| A-06 | `uuid` 9.0.1 — missing buffer bounds check di v3/v5/v6 ketika argumen `buf` diberikan. | `src/lib/id.ts:9`, `:14` | App hanya memanggil `uuidv4()` dan `uuidv5(seed, NAMESPACE)` **tanpa** `buf` (`src/lib/id.ts`), sehingga jalur rentan tidak tercapai. | P2 | S |
| A-07 | `images[]` dari backup/pull tidak divalidasi sebagai URL. | `src/services/entryFields.ts:93-95` | `coerceEntry` hanya menyaring `typeof === 'string'` lalu memotong ke 6 item — tidak ada pemeriksaan skema. Tidak ada komponen yang me-render `entry.images` hari ini (grep seluruh `src/components` dan `src/pages` tidak menemukan sink), jadi belum ada dampak. Kalau nanti dirender, nilai ini melewati allowlist sanitizer. | P2 | S |
| A-08 | Migrasi tidak menulis `grant` eksplisit untuk tabel `public.entries`. | `supabase/migrations/20261001000000_entries.sql:16-62` | Hanya RPC yang di-grant eksplisit (`:117-118`). Hak tabel mengandalkan default privilege Supabase (`auto_expose_new_tables`, lihat `supabase/config.toml:17-22`). Fail-closed: grant hilang menghasilkan error permission, bukan kebocoran. Tapi migrasi jadi tidak self-contained bila project mengubah default itu. | P2 | S |
| A-09 | Avatar memuat gambar dari origin pihak ketiga. | `src/constants/avatar.ts:5`; `src/components/ui/Avatar.tsx:42` | `https://api.dicebear.com/9.x/lorelei/svg?seed=...` menerima IP dan Referer pada setiap halaman yang menampilkan avatar. Tidak ada data diary yang keluar, dan seed berasal dari daftar tetap 8 pilihan (`AVATAR_SEED_CHOICES`) yang di-`encodeURIComponent` — tidak ada jalur injeksi URL. Ada fallback inisial lokal saat offline/gagal. | P2 | S |
| A-10 | `auth.uid()` tidak dibungkus `(select auth.uid())`. | `supabase/migrations/20261001000000_entries.sql:50,54,58,62,95` | Lint performa Supabase: tanpa pembungkusan, fungsi dievaluasi per baris alih-alih sekali per statement. **Performa saja, bukan keamanan** — semantik RLS tetap benar. | P2 | S |

## Cakupan — jalur yang diverifikasi aman

**Secrets (bersih).**
- `git grep` pola kunci di file tracked non-md: hanya dua hit, keduanya bukan rahasia — komentar peran `service_role` di `supabase/config.toml:20` dan `openai_api_key = "env(OPENAI_API_KEY)"` di `:102` (substitusi env, nilai tidak ada).
- Anon key nyata (literal di-redaksi di laporan ini): **tidak** ada di tracked, **tidak** ada di history (`git log --all -S` kosong). Hanya di `.env.local`.
- `.env.local` ditutup oleh `.gitignore` (`*.local`, `.env.local`) dan oleh `supabase/.gitignore`. `git ls-files | grep -i env` → hanya `.env.example`. `git log --all --name-only` untuk path `.env*` → hanya `.env.example`.
- `.env.example` hanya berisi placeholder yang dikomentari; dokumentasinya benar (anon key publik by design, RLS yang melindungi).
- `scripts/activate-supabase.mjs` tidak menuliskan key ke stdout (`<hidden>`, baris 88) dan memvalidasi bentuk URL serta prefix key sebelum menulis.
- `dist/` (gitignored) memuat anon key ter-inline — perilaku normal `VITE_*`, bukan temuan. Live bundle di Vercel **tidak** memuat URL/key Supabase (dicek dengan curl), konsisten dengan build local-only yang di-deploy.

**XSS.** Satu-satunya `dangerouslySetInnerHTML` di seluruh `src/` ada di `src/pages/Reader/ReaderContent.tsx:38`, dan nilainya melewati `sanitizeEntryHtml` tepat di atasnya (`:19`), sementara penyimpanan sudah membersihkan lebih dulu di `coerceEntry` (`src/services/entryFields.ts:73-74`). Tidak ada `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`document.write`/`eval`/`new Function` lain di `src/` — satu-satunya `innerHTML` kedua ada di `src/services/pdfService.ts:42`, juga disanitasi, dengan judul memakai `textContent` (`:34`).
16 vektor diuji di Chromium nyata terhadap config persis dari `sanitize.ts`: `<script>`, `img onerror`, `svg onload`, `javascript:` href, `data:text/html` href, `iframe`, `form`, `<style>`, `object`, `math/mtext/mglyph`, `noscript`, injeksi atribut, nested — semua netral. `data:image/svg+xml` bertahan sebagai `src` `<img>`, dan itu inert (SVG di `<img>` tidak punya konteks eksekusi skrip) serta ter-escape `&lt;`. Jalur import backup masuk lewat `parseBackup` → `coerceEntry` (sanitasi per entri) dan `coerceSettings` (whitelist theme/fontSize, string lain dirender sebagai teks React). Editor tiptap: `setContent(storedContent)` di `src/pages/Write/useEditorSetup.ts:76` menerima nilai yang sudah disanitasi di boundary storage, dan tiptap mem-parse ke skema-nya sendiri. `Link` extension memvalidasi protokol (`isAllowedUri`, tanpa `javascript:`), `Image` hanya menerima `http(s)` dari prompt (`:98`). Tidak ada fitur search highlight (grep kosong); hasil pencarian dirender sebagai anak React. Toast merender pesan sebagai teks.

**CSP.** `node scripts/check-csp-parity.mjs` → `ALL PASS`, exit 0. Perbandingan byte independen mengonfirmasi ketiga CSP identik panjang 286 di `vercel.json`, `netlify.toml`, `scripts/serve-with-csp.mjs`. `script-src 'self'` tanpa `unsafe-inline`/`unsafe-eval`; `object-src 'none'`; `base-uri 'self'`; `form-action 'none'`; `frame-ancestors 'none'`. Live (curl ke `dearmydiary-eight.vercel.app`) mengirim CSP, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`. `style-src 'unsafe-inline'` dan `img-src https:` adalah tradeoff terdokumentasi (Framer Motion menulis style attribute; insert image by URL) — sesuai daftar invariant, tidak dilaporkan. Path handling `scripts/serve-with-csp.mjs` diuji: `/%2e%2e%2f%2e%2e%2fpackage.json` dan `/../../package.json` keduanya mengembalikan body `index.html` (SPA fallback), bukan file di luar `dist`.

**Authz / isolasi data.** `public.entries` mengaktifkan RLS (`:46`). Empat policy lengkap: select `using (auth.uid() = owner_id)` (`:49-50`), insert `with check` (`:53-54`), update `using` **dan** `with check` (`:57-58`), delete `using` (`:61-62`). PK komposit `(owner_id, id)` (`:37`) mencegah tabrakan id antar akun. RPC `upsert_entries` (`:76-115`) memakai `security invoker` + `set search_path = public`, menyaring `where r.owner_id = auth.uid()` pada SELECT yang menyuplai insert (`:95`), dan update konflik tetap tunduk pada policy UPDATE. `revoke all ... from public, anon` lalu `grant execute ... to authenticated` (`:117-118`). Tidak ada jalur menulis baris atas nama user lain. Adapter sengaja tidak memfilter owner karena RLS yang menutup (`src/services/supabase/adapter.ts:65-90`) — konsisten dan benar. `max_rows = 1000` (`supabase/config.toml:12`) cocok dengan `PAGE = 1000` di adapter.

**Client-side trust.** `coerceEntry` memvalidasi seluruh record dari luar (import + pull Supabase): id/date/title/content/mood (whitelist `MOODS`)/tags (normalisasi, dedupe, cap 10)/content dipotong 20 000 char sebelum disanitasi/location dipotong 120/images disaring string + cap 6; tanggal dinormalisasi lewat `safeIso`. `needsRepair` + repair-on-read menulis balik record lama. Pull: `fromRow` → `filter(looksLikeEntry)` → `map(coerceEntry)` (`adapter.ts:88`). `replaceEntries` mempertahankan tombstone kecuali restore eksplisit yang lebih baru.

**Supply chain.** Tidak ada script eksternal di `index.html` maupun `dist/index.html` (hanya `/src/main.tsx` dan `/assets/*`). Font self-hosted (`public/fonts/*.woff2`, `src/styles/fonts.css` memakai path `/fonts/...`), tidak ada Google Fonts. Tidak ada `preinstall`/`postinstall` di `package.json`. Satu-satunya origin pihak ketiga di runtime adalah DiceBear (A-09).

**Storage.** Tidak ada token/sesi yang disimpan app sendiri: grep `access_token|refresh_token|sessionStorage|indexedDB` di `src/` kosong. Hanya key `deardiary:*` yang ditulis, lewat `src/lib/storage.ts:14,76` (entries, settings, draft, view, outbox, owner, clock). Key `owner` menyimpan **user id** Supabase, bukan token — didokumentasikan di `src/services/sync/types.ts` dan `src/store/syncStore.ts`. Sesi Supabase di localStorage dipegang SDK, sesuai invariant yang disengaja.

## Output mentah

```
$ cd "D:/.1Kuliah/Coding/Dear dia"
$ git grep -nE "eyJ[A-Za-z0-9_-]{20,}|sb_secret_|service_role|api[_-]?key\s*[:=]|password\s*[:=]" -- . ':!*.md' ':!package-lock.json' || echo clean
supabase/config.toml:20:# `postgres` are reachable through the Data API roles (`anon`, `authenticated`, `service_role`)
supabase/config.toml:102:openai_api_key = "env(OPENAI_API_KEY)"
```

```
$ node scripts/check-csp-parity.mjs
# csp parity
PASS  vercel.json carries a CSP — 286
PASS  netlify.toml carries a CSP — 286
PASS  serve-with-csp.mjs carries a CSP — 286
PASS  vercel.json and netlify.toml are byte-identical — 286 vs 286
PASS  netlify.toml and serve-with-csp.mjs are byte-identical — 286 vs 286
PASS  connect-src allows https://*.supabase.co — connect-src 'self' https://*.supabase.co wss://*.supabase.co
PASS  connect-src allows wss://*.supabase.co — connect-src 'self' https://*.supabase.co wss://*.supabase.co
PASS  no unsafe-eval anywhere in the policy — absent
PASS  script-src does not carry 'unsafe-inline' — script-src 'self'
ALL PASS
EXIT=0
```

```
$ npm audit 2>&1 | tail -25

  node_modules/vite

react-router  6.0.0 - 7.17.0
Severity: moderate
React Router: Open redirect via backslash in <Link> and useNavigate (CVE-2025-68470 bypass) - https://github.com/advisories/GHSA-wrjc-x8rr-h8h6
React Router: Arbitrary Constructor Injection via deserializeErrors() in React Router SSR Hydration - https://github.com/advisories/GHSA-337j-9hxr-rhxg
fix available via `npm audit fix --force`
Will install react-router-dom@7.18.4, which is a breaking change
node_modules/react-router
  react-router-dom  6.0.0-alpha.0 - 7.17.0
  Depends on vulnerable versions of react-router
  node_modules/react-router-dom

uuid  <11.1.1
Severity: moderate
uuid: Missing buffer bounds check in v3/v5/v6 when buf is provided - https://github.com/advisories/GHSA-w5hq-g745-h8pq
fix available via `npm audit fix --force`
Will install uuid@14.0.2, which is a breaking change
node_modules/uuid


34 vulnerabilities (33 moderate, 1 high)

To address all issues (including breaking changes), run:
  npm audit fix --force
```

```
$ npm audit --json | (ringkas high/critical)
total {"info":0,"low":0,"moderate":33,"high":1,"critical":0,"total":34}
HIGH: vite <=6.4.2  fixAvailable: {"name":"vite","version":"8.3.2","isSemVerMajor":true}
  via: Vite Vulnerable to Path Traversal in Optimized Deps `.map` Handling | https://github.com/advisories/GHSA-4w7w-66w2-5vf9
  via: launch-editor: NTLMv2 hash disclosure via UNC path handling on Windows | https://github.com/advisories/GHSA-v6wh-96g9-6wx3
  via: vite: `server.fs.deny` bypass on Windows alternate paths | https://github.com/advisories/GHSA-fx2h-pf6j-xcff
moderate (non-tiptap): esbuild <=0.24.2, react-router 6.0.0-7.17.0, react-router-dom 6.0.0-alpha.0-7.17.0, uuid <11.1.1
@tiptap/core severity: moderate range: <=3.30.3  fixAvailable: {"name":"@tiptap/extension-character-count","version":"3.31.4","isSemVerMajor":true}
  moderate Tiptap: mergeAttributes() turns an own __proto__ key into inherited executable DOM attributes
terpasang: vite 5.4.21 · react-router-dom 6.30.6 · uuid 9.0.1 · @tiptap/core 2.27.3 · dompurify 3.4.16 · @supabase/supabase-js 2.117.2
versi terbaru 2.x @tiptap/core: 2.27.3 (tidak ada patch di 2.x)
```

```
$ grep -rn "dangerouslySetInnerHTML" src/
src/\pages\Reader\ReaderContent.tsx:38:      dangerouslySetInnerHTML={{ __html: safe }}
```

```
$ grep -rn "DOMPurify\|sanitize" src/lib/sanitize.ts src/services/ | head -30
src/lib/sanitize.ts:1:import DOMPurify from 'dompurify';
src/lib/sanitize.ts:47:export function sanitizeEntryHtml(html: string): string {
src/lib/sanitize.ts:49:  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOWED_URI_REGEXP });
src/lib/sanitize.ts:58: * A regex is not the defense — `sanitizeEntryHtml` is. This only decides whether a
src/lib/sanitize.ts:59: * stored record is worth a sanitizer pass, so the repair-on-read path stays free for
src/lib/sanitize.ts:60: * ordinary entries and still catches a record that predates the sanitizer.
src/services/\entryFields.ts:4:import { looksUnsafe, sanitizeEntryHtml } from '@/lib/sanitize';
src/services/\entryFields.ts:5:import { sanitizeTags, sanitizeTitle } from '@/lib/validate';
src/services/\entryFields.ts:15:    tags: sanitizeTags(entry.tags),
src/services/\entryFields.ts:32:  return patch.title !== undefined ? sanitizeTitle(patch.title) : current;
src/services/\entryFields.ts:60: * The body is sanitized here, at the boundary where external data enters: the reader
src/services/\entryFields.ts:61: * sanitizes on render too, but the PDF export builds a live DOM node from the stored
src/services/\entryFields.ts:71:  // body, and an unbounded value reaches localStorage (quota) and DOMPurify (a full parse
src/services/\entryFields.ts:74:  const content = sanitizeEntryHtml(rawContent);
src/services/\entryFields.ts:77:  const title = sanitizeTitle(typeof raw.title === 'string' ? raw.title : '');
src/services/\entryFields.ts:86:    tags: sanitizeTags(Array.isArray(raw.tags) ? raw.tags.filter((tag) => typeof tag === 'string') : []),
src/services/\entryFields.ts:106: * carries markup that could execute — a record written before the sanitizer existed is
src/services/\entryWrite.ts:3:import { sanitizeTitle } from '@/lib/validate';
src/services/\entryWrite.ts:15:    title: sanitizeTitle(draft.title ?? ''),
src/services/\pdfService.ts:1:import { sanitizeEntryHtml } from '@/lib/sanitize';
src/services/\pdfService.ts:42:  body.innerHTML = sanitizeEntryHtml(entry.content);
```

```
$ (A-01) Chromium nyata + DOMPurify 3.4.16, config persis dari src/lib/sanitize.ts
tags:  ["p","br","strong","b","em","i","u","s","h1","h2","h3","ul","ol","li","blockquote","code","pre","hr","a","img"]
attrs: ["href","target","rel","src","alt","title"]
uri:   "/^(?:https?|mailto|tel|data:image\\/)/i"

--- DENGAN ALLOWED_URI_REGEXP (seperti tertulis di sanitize.ts) ---
in:  <a href="https://x" target="_blank" rel="noopener noreferrer nofollow" title="hello">l</a>
out: <a href="https://x" title="hello">l</a>          <-- target & rel HILANG
in:  <a href="mailto:a@b.c" target="_blank">m</a>
out: <a href="mailto:a@b.c">m</a>                     <-- target HILANG
in:  <img src="https://x/a.png" alt="desc" title="tip">
out: <img src="https://x/a.png" alt="desc" title="tip">  (tidak terpengaruh)
in:  <img src="data:image/png;base64,iVBOR" alt="a">
out: <img src="data:image/png;base64,iVBOR" alt="a">     (tidak terpengaruh)

--- TANPA ALLOWED_URI_REGEXP (validator internal DOMPurify) ---
in:  <a href="https://x" target="_blank" rel="noopener noreferrer nofollow" title="hello">l</a>
out: <a href="https://x" target="_blank" rel="noopener noreferrer nofollow" title="hello">l</a>   <-- bertahan

$ (A-01) regex rel-forcing diuji terpisah — gagal saat ada `>` mentah di nilai atribut sebelumnya:
true  <- <a target="_blank" href="https://evil">x</a>
false <- <a title="a > b" target="_blank" href="https://evil">x</a>
false <- <a title="a > b" href="https://evil" target="_blank">x</a>
(DOMPurify men-serialize `>` menjadi `&gt;` di dalam nilai atribut, jadi bentuk `false` di atas tidak
tercapai setelah sanitasi — regex tetap rapuh, tapi bukan celah hidup.)

$ (A-01) mekanisme di sumber DOMPurify — ALLOWED_URI_REGEXP menggantikan IS_ALLOWED_URI yang dipakai
        untuk SEMUA atribut (node_modules/dompurify/dist/purify.cjs.js):
2075:  if (FORBID_ATTR[lcName]) return false;
2084:  if (URI_SAFE_ATTRIBUTES[lcName]) return true;                     // alt,class,for,id,label,name,pattern,placeholder,role,summary,title,value,style,xmlns
2085:  if (regExpTest(IS_ALLOWED_URI$1, ...value)) return true;          // <-- regex kustom masuk di sini
2086:  if ((lcName==="src"||lcName==="xlink:href"||lcName==="href") && ... DATA_URI_TAGS[lcTag]) return true;
`target` dan `rel` tidak ada di URI_SAFE_ATTRIBUTES, dan nilainya tidak cocok regex kustom -> dibuang.
```

```
$ (A-01) default tiptap Link — membuktikan target/rel memang hilang saat round-trip
node_modules/@tiptap/extension-link/dist/index.js:253-257
  HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer nofollow', class: null },
```

```
$ (XSS) 16 vektor di Chromium nyata terhadap sanitizeEntryHtml — semua netral
script tag          -> <p>hi</p>
img onerror         -> <img>
svg onload          -> (kosong)
javascript: href    -> <a>c</a>
data:text/html href -> <a>c</a>
data:image src      -> <img src="data:image/svg+xml,&lt;svg onload=alert(1)&gt;">   (inert di <img>)
iframe / form / style / object / math-mglyph / noscript -> dinetralkan
tidak ada satupun yang mengeksekusi skrip (window.__pwn tidak pernah ter-set)
```

```
$ (A-02) project ref nyata di file tracked
$ git log --all -S"<project-ref>" --name-only --pretty=format:"COMMIT %h"
COMMIT e88a853
reports/apply/swarm-prompt-pack.md
$ grep -n "<project-ref>" reports/apply/swarm-prompt-pack.md
6:Supabase project: `<project-ref>` (tabel `entries`, RLS, RPC `upsert_entries` sudah ada).
16:- Supabase project: <project-ref>. Tabel public.entries + RLS + RPC upsert_entries SUDAH ada.
173:npm run sync:on -- https://<project-ref>.supabase.co <anon-key>
(literal project ref di-redaksi di laporan ini dan di swarm-prompt-pack.md; nilai asli hanya ada di history git)

$ (A-02) anon key nyata TIDAK tracked dan TIDAK di history
$ git grep -n "<anon-key>" -- . || echo "clean"
clean: real anon key NOT tracked
$ git log --all -S"<anon-key>" --oneline
(kosong)
```

```
$ (CSP) perbandingan byte independen (bukan lewat skrip repo)
vercel===netlify: true
vercel===serve:   true
len 286 286 286
script-src 'self' dan tanpa unsafe-eval: true

$ (CSP) header live — curl -sI https://dearmydiary-eight.vercel.app
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY

$ (CSP) path traversal pada scripts/serve-with-csp.mjs — diuji, tidak tembus
/index.html                                        -> 200
/%2e%2e%2f%2e%2e%2fpackage.json                    -> 200, body = index.html (SPA fallback)
/../../package.json                                -> 200, body = index.html (SPA fallback)
```

```
$ (Secrets) .env.local tidak tracked; hanya .env.example yang tracked
$ git ls-files | grep -i env
.env.example
$ git log --all --name-only --pretty=format: | sort -u | grep -iE "^\.env"
.env.example
$ cat .gitignore
node_modules
dist
dist-ssr
*.local
.env
.env.local
...
```

```
$ (Storage) tidak ada token milik app
$ grep -rn "access_token\|refresh_token\|auth.token\|sessionStorage\|indexedDB" src/
(kosong)
$ grep -rn "localStorage.setItem" src/
src/lib/storage.ts:14:    window.localStorage.setItem(probe, '1');
src/lib/storage.ts:76:      window.localStorage.setItem(key, raw);
```

```
$ (Supply chain) tidak ada script eksternal
$ grep -rnE "<script|addScriptTag" index.html src/
index.html:23:    <script type="module" src="/src/main.tsx"></script>
$ grep -nE "url\(|https?://" src/styles/fonts.css
18:  src: url('/fonts/playfair-var.woff2') format('woff2');
26:  src: url('/fonts/inter-var.woff2') format('woff2');
34:  src: url('/fonts/cormorant-400-italic.woff2') format('woff2');
42:  src: url('/fonts/caveat-400.woff2') format('woff2');
50:  src: url('/fonts/jetbrains-mono-400.woff2') format('woff2');
```

## Handoff (di luar scope audit ini)

1. **Perbaikan A-01.** Pilihan terbersih: hapus `ALLOWED_URI_REGEXP` dari opsi `DOMPurify.sanitize` (validator internal DOMPurify sudah memblokir `javascript:`/`data:` untuk `href`/`src` dan tetap mengizinkan `data:image/*` untuk `img` lewat `DATA_URI_TAGS`), lalu biarkan blok rel-forcing bekerja. Kalau allowlist URI kustom tetap diinginkan, tambahkan `target` dan `rel` ke `ADD_URI_SAFE_ATTR` supaya keduanya tidak lewat jalur validasi URI. Perlu keputusan produk: apakah link diary boleh `target="_blank"`.
2. **Dead code.** `src/hooks/useLocalStorage.ts` diekspor dari `src/hooks/index.ts:12` tapi tidak dipakai di mana pun. Kandidat hapus.
3. **Env var tidak terbaca.** `.env.example` mendokumentasikan `VITE_APP_NAME` dan `VITE_STORAGE_NAMESPACE`, tapi tidak ada kode yang membacanya (`src/constants/config.ts` dan `src/constants/storageKeys.ts` memakai literal). Samakan salah satu arah.
4. **`repository` placeholder.** `src/constants/config.ts:9` menunjuk `https://github.com/deardiary/deardiary`, bukan repo sebenarnya (`whisxdr/...`). Kosmetik, muncul di About.
5. **Verifikasi RLS di project nyata.** Migrasi sudah benar di teks, tapi kebenaran sesungguhnya ada di database. Perlu sekali cek di SQL editor: `select tablename, rowsecurity from pg_tables where schemaname='public'` dan `select polname, cmd, qual, with_check from pg_policies where tablename='entries'`, plus `select prosecdef, proconfig from pg_proc where proname='upsert_entries'`. Juga konfirmasi `{{ .Token }}` sudah ada di **kedua** template email Supabase (Confirm signup + Magic Link) — kalau tidak, kode OTP tidak pernah sampai.
6. **A-03/A-04/A-05/A-06 satu paket upgrade.** Vite 8, tiptap 3.31.4, react-router 7, uuid 11 semuanya major dan semuanya butuh uji regresi. Bukan pekerjaan satu commit.
7. **Rotasi key bila repo pernah publik dengan ref A-02.** Anon key aman (publik by design), tapi kalau ada key lain yang pernah tertulis di file yang sudah dihapus dari history, `git log -p --all` penuh perlu ditelusuri terpisah. Audit ini hanya menyisir pola dan `-S` untuk nilai yang diketahui.
