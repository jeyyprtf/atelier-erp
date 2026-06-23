<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/jeyyprtf/atelier-erp/master/public/photo-juan.webp">
    <img src="https://raw.githubusercontent.com/jeyyprtf/atelier-erp/master/public/photo-juan.webp" alt="Atelier" width="128" style="border-radius:24px">
  </picture>
</p>

<h1 align="center">Atelier — Team ERP</h1>

<p align="center">
  A calm, gallery-quiet workspace for your team's tasks, progress, and notes.<br>
  Built with React + Supabase. No backend. Deploy in 2 minutes.
</p>

---

<p align="center">
  <a href="#english">🇬🇧 English</a> &nbsp;|&nbsp;
  <a href="#indonesia">🇮🇩 Indonesia</a>
  <br><br>
  <img src="https://img.shields.io/badge/react-19-61DAFB?logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/vite-8-646CFF?logo=vite" alt="Vite 8">
  <img src="https://img.shields.io/badge/tailwind-v4-06B6D4?logo=tailwindcss" alt="Tailwind v4">
  <img src="https://img.shields.io/badge/supabase-hosted-3ECF8E?logo=supabase" alt="Supabase">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License">
</p>

---

<p id="english"></p>

## 🇬🇧 English

**Atelier** is a lightweight internal ERP for small teams. It replaces scattered spreadsheets and chat threads with a single, calm workspace. No backend servers — everything runs on Supabase (Postgres + Auth + Realtime).

### What's inside

| Module | Who | What it does |
|---|---|---|
| **Dashboard** | Everyone | Team overview at a glance: your board breakdown, team progress snapshot, due-this-week list, recent activity. |
| **My Tasks** | Everyone | Your personal Kanban board. Drag tasks across stages: To Do → In Progress → Approval Pending → Done. Time tracking & comments per task. |
| **Team Progress** | Everyone | Every task across the team, grouped by stage. Filter per member. See everyone's progress at a glance. |
| **Task Assignment** | Lead, C-Level | Create and edit tasks. Assign to one or more people. Set PIC, deadline, override progress %, and export CSV. |
| **Meeting Notes** | Everyone | Capture what was discussed. Title, date, summary, and full notes with markdown. |
| **Resources** | Everyone | A link repository for shared documents, spreadsheets, PDFs — anything the team references. |
| **Members** | C-Level | Promote or demote roles: Member → Lead → C-Level. |
| **Profile** | Everyone | Edit your name, upload & crop profile photo, change password, switch Light/Dark/System theme, toggle English/Indonesian. |

### Features

- 🎨 **Art-gallery design** — warm bone canvas, Fraunces + Inter fonts, smooth Framer Motion animations
- 🌙 **Dark mode** — 3-way toggle (Light / Dark / System), zero flash on reload
- 🌐 **Bilingual** — English and Bahasa Indonesia, persisted preference
- 📱 **Responsive + PWA** — sidebar becomes a drawer on mobile, Kanban stacks. Installable to home screen
- 🔐 **Row-Level Security** — permissions enforced at the database level, not just the UI
- ⚡ **Realtime** — drag a task, add a comment, assign someone — and teammates see it live
- 🔑 **Auth** — Email/password signup with verification, Google OAuth ready
- 🖼️ **Avatar** — upload & crop profile photo (max 1MB), or initials fallback
- 💬 **Task comments** — threaded discussion per task with markdown support
- 🔔 **Notifications** — bell icon, realtime alerts on assignment, status change, and comments
- ⏱️ **Time tracking** — log minutes per task, view total accumulated time
- 📝 **Markdown** — bold, italic, links, headings, lists in descriptions, comments, and notes
- 📥 **Export CSV** — one-click export all tasks from Assignment table
- ⌨️ **Keyboard shortcuts** — `D` Dashboard, `T` Tasks, `E` Team, `A` Assign, `M` Meeting, `R` Resources, `P` Profile

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjeyyprtf%2Fatelier-erp&env=VITE_SUPABASE_URL,VITE_SUPABASE_KEY)

### Manual setup (6 steps)

#### 1. Clone

```bash
git clone https://github.com/jeyyprtf/atelier-erp.git
cd atelier-erp
```

#### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com) → New Project. Wait ~2 minutes for the database to provision.

#### 3. Run the schema

- Supabase Dashboard → **SQL Editor**
- Open [`setup/schema.sql`](setup/schema.sql), copy-paste the entire file, and **Run**
- This creates all tables, RLS policies, functions, triggers, and realtime

#### 4. Enable email verification (optional but recommended)

- Supabase Dashboard → **Authentication** → **Settings**
- Under **Email**, disable "Confirm email" if you want instant signup
- Under **Attack Protection**, enable **Leaked password protection**

#### 5. Set environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_KEY=your-publishable-key
```

Find these at: Supabase Dashboard → **Settings** → **API**.

#### 6. Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Sign up with your email. Then promote yourself to C-Level:

- Supabase Dashboard → **Table Editor** → `profiles` → edit your row → set `role = 'c_level'`

#### Deploy to Vercel

```bash
npx vercel --prod
```

Set the same environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`) in Vercel's dashboard.

After deploying, update Supabase **Authentication → URL Configuration** with your production domain:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app`, `https://your-app.vercel.app/**`

---

### 🤖 Setup with Claude Code (shortcut)

If you use **Claude Code**, paste this prompt:

```
Clone https://github.com/jeyyprtf/atelier-erp, then:
1. Help me create a Supabase project and run the schema
2. Configure the .env file with my Supabase credentials
3. Install dependencies and start the dev server
4. Set up Vercel deployment
```

Claude Code (or any Supabase-capable AI coding tool) will guide you step-by-step and run the SQL automatically.

---

### Google OAuth (optional)

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create OAuth client ID → **Web application**
2. **Authorized redirect URIs**: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
3. Supabase Dashboard → **Authentication** → **Sign In / Providers** → **Google** → enable → paste Client ID + Secret
4. Add your app domain to **Authorized JavaScript origins** in Google Cloud

---

### Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19 (JSX) + Vite 8 |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) |
| Animation | Framer Motion |
| Drag & drop | @dnd-kit |
| Image crop | react-image-crop |
| Auth + DB | Supabase (hosted) |
| Realtime | Supabase Channels (Postgres publication) |
| Routing | React Router v7 |
| Hosting | Vercel (zero-config) |
| PWA | Service Worker + Web Manifest |

### Project structure

```
src/
├── auth/           AuthProvider (session + profile + role)
├── components/     Board, Layout, TaskCard, TaskModal, UI primitives,
│                   Markdown, AvatarCropModal
├── lib/            supabase client, i18n, theme, notifications,
│                   useTasks, useProfiles, useShortcuts
└── pages/          Dashboard, MyTasks, Team, Assign, Meetings,
                    Resources, Members, Profile, Login, Signup
public/
├── sw.js           Service Worker (offline caching)
└── manifest.json   PWA manifest
setup/
└── schema.sql      Complete Supabase schema (one file)
```

### License

MIT. Use it, modify it, ship it.

---

<p id="indonesia"></p>

## 🇮🇩 Indonesia

**Atelier** adalah ERP internal ringan untuk tim kecil. Menggantikan spreadsheet dan chat yang berserakan dengan satu ruang kerja yang tenang. Tanpa server backend — semuanya berjalan di Supabase (Postgres + Auth + Realtime).

### Isinya

| Modul | Siapa | Fungsinya |
|---|---|---|
| **Dasbor** | Semua | Ringkasan tim sekilas: papanmu, progres tim, deadline minggu ini, aktivitas terbaru. |
| **Tugasku** | Semua | Papan Kanban pribadi. Seret tugas antar tahap: To Do → In Progress → Approval Pending → Done. Pencatatan waktu & komentar per tugas. |
| **Progres Tim** | Semua | Semua tugas di tim, dikelompokkan per status. Filter per anggota. Lihat progres semua orang sekilas. |
| **Penugasan** | Lead, C-Level | Buat dan edit tugas. Assign ke satu atau beberapa orang. PIC, deadline, progress override, dan export CSV. |
| **Catatan Rapat** | Semua | Catat hasil diskusi. Judul, tanggal, ringkasan, dan notes lengkap dengan markdown. |
| **Dokumen** | Semua | Repositori tautan untuk spreadsheet, dokumen, PDF — apa pun referensi tim. |
| **Anggota** | C-Level | Promosikan atau turunkan peran: Anggota → Ketua → C-Level. |
| **Profil** | Semua | Edit nama, upload & crop foto profil, ganti kata sandi, pilih tema Terang/Gelap/Sistem, ganti Bahasa. |

### Fitur

- 🎨 **Desain art-gallery** — kanvas bone hangat, font Fraunces + Inter, animasi Framer Motion yang mulus
- 🌙 **Dark mode** — 3 pilihan (Terang / Gelap / Sistem), tanpa flash saat reload
- 🌐 **Bilingual** — Inggris dan Bahasa Indonesia, pilihan tersimpan
- 📱 **Responsif + PWA** — sidebar jadi drawer di mobile, Kanban adaptif. Bisa di-install ke home screen
- 🔐 **Row-Level Security** — izin ditegakkan di level database, bukan cuma UI
- ⚡ **Realtime** — seret tugas, tambah komentar, assign anggota — dan tim melihatnya langsung
- 🔑 **Auth** — Daftar dengan email/password + verifikasi, Google OAuth siap
- 🖼️ **Avatar** — upload & crop foto profil (max 1MB), atau inisial fallback
- 💬 **Komentar tugas** — diskusi per tugas dengan dukungan markdown
- 🔔 **Notifikasi** — ikon lonceng, alert realtime saat di-assign, status berubah, atau komentar baru
- ⏱️ **Pencatatan waktu** — log menit per tugas, lihat total akumulasi
- 📝 **Markdown** — bold, italic, link, heading, list di deskripsi, komentar, dan catatan
- 📥 **Export CSV** — satu klik download semua tugas dari tabel Penugasan
- ⌨️ **Shortcut keyboard** — `D` Dasbor, `T` Tugas, `E` Tim, `A` Assign, `M` Meeting, `R` Dokumen, `P` Profil

### Deploy sekali klik

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjeyyprtf%2Fatelier-erp&env=VITE_SUPABASE_URL,VITE_SUPABASE_KEY)

### Setup manual (6 langkah)

#### 1. Clone

```bash
git clone https://github.com/jeyyprtf/atelier-erp.git
cd atelier-erp
```

#### 2. Buat project Supabase

Buka [supabase.com](https://supabase.com) → New Project. Tunggu ~2 menit sampai database siap.

#### 3. Jalankan schema

- Supabase Dashboard → **SQL Editor**
- Buka file [`setup/schema.sql`](setup/schema.sql), copy-paste seluruh file, lalu **Run**
- Ini membuat semua tabel, RLS policies, fungsi, trigger, dan realtime

#### 4. Aktifkan verifikasi email (opsional tapi disarankan)

- Supabase Dashboard → **Authentication** → **Settings**
- Di bagian **Email**, nonaktifkan "Confirm email" jika ingin daftar langsung tanpa verifikasi
- Di bagian **Attack Protection**, aktifkan **Leaked password protection**

#### 5. Atur environment variables

Salin `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Buka `.env` dan isi dengan kredensial Supabase-mu:

```
VITE_SUPABASE_URL=https://PROJECT-KAMU.supabase.co
VITE_SUPABASE_KEY=publishable-key-kamu
```

Temukan di: Supabase Dashboard → **Settings** → **API**.

#### 6. Jalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`. Daftar dengan emailmu. Lalu promosikan dirimu ke C-Level:

- Supabase Dashboard → **Table Editor** → `profiles` → edit barismu → `role = 'c_level'`

#### Deploy ke Vercel

```bash
npx vercel --prod
```

Set environment variables yang sama (`VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`) di dashboard Vercel.

Setelah deploy, update Supabase **Authentication → URL Configuration** dengan domain production-mu:
- **Site URL**: `https://aplikasi-kamu.vercel.app`
- **Redirect URLs**: `https://aplikasi-kamu.vercel.app`, `https://aplikasi-kamu.vercel.app/**`

---

### 🤖 Setup dengan Claude Code (jalan pintas)

Kalau kamu pakai **Claude Code**, tempel prompt ini:

```
Clone https://github.com/jeyyprtf/atelier-erp, lalu:
1. Bantu saya buat project Supabase dan jalankan schema-nya
2. Konfigurasi file .env dengan kredensial Supabase saya
3. Install dependencies dan jalankan dev server
4. Setup deploy ke Vercel
```

Claude Code (atau AI coding tool lain yang support Supabase) akan memandu langkah demi langkah dan menjalankan SQL secara otomatis.

---

### Google OAuth (opsional)

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create OAuth client ID → **Web application**
2. **Authorized redirect URIs**: `https://PROJECT-KAMU.supabase.co/auth/v1/callback`
3. Supabase Dashboard → **Authentication** → **Sign In / Providers** → **Google** → enable → tempel Client ID + Secret
4. Tambah domain aplikasi ke **Authorized JavaScript origins** di Google Cloud

---

### Tech stack

| Layer | Pilihan |
|---|---|
| Framework | React 19 (JSX) + Vite 8 |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) |
| Animasi | Framer Motion |
| Drag & drop | @dnd-kit |
| Auth + DB | Supabase (hosted) |
| Realtime | Supabase Channels (Postgres publication) |
| Routing | React Router v7 |
| Hosting | Vercel (zero-config) |

### Struktur project

```
src/
├── auth/           AuthProvider (session + profile + role)
├── components/     Board, Layout, TaskCard, TaskModal, UI primitives
├── lib/            supabase client, i18n, theme, data hooks
└── pages/          Login, Signup, MyTasks, Team, Assign,
                    Meetings, Resources, Members, Profile
setup/
└── schema.sql      Skema Supabase lengkap (satu file)
```

### Lisensi

MIT. Pakai, modifikasi, sebarkan.
