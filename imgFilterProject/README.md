# Halloween Costume Flex 🎃👻

Turn any costume photo into a spooky, shareable flex. Upload a photo, apply Halloween filters, generate a savage-but-playful AI caption, and export a looping animation that’s perfect for socials or a hackathon demo.

— Built for speed, style, and vibes. 🦇

## ✨ Highlights

- **Instant upload & preview**: Drag-and-drop or click to upload
- **One-tap filters**: Vampire, Zombie, Ghost, Pumpkin, Witch, Demon, Skeleton, Possessed
- **AI captions**: Gemini-powered witty roasts with adjustable sass level
- **Animated output**: Smooth, client-side video created via Canvas + MediaRecorder
- **Share & download**: Download the final animation and copy a link
- **Optional backend**: Store GIFs/videos + captions in Postgres (API included)

## 🚀 Quickstart

Prereqs: Node.js and npm. We recommend installing Node via nvm: `https://github.com/nvm-sh/nvm#installing-and-updating`.

```sh
# 1) Clone
git clone <YOUR_GIT_URL>
cd imgFilterProject

# 2) Install deps
npm install

# 3) (Optional) Set environment variables
cp .env.example .env  # if you add an example file

# Frontend-only dev (starts client + server concurrently)
npm run dev

# OR run pieces individually
npm run dev:client    # Vite dev server (frontend)
npm run dev:server    # Express API (backend)
```

Open the app at `http://localhost:5173` (default Vite port). The API runs at `http://localhost:3001` by default.

## 🔧 Configuration

Create a `.env` in `imgFilterProject/` to enable AI and database features.

Frontend / AI:

```env
# Used by the AI caption feature
VITE_GEMINI_API_KEY=your_google_generative_ai_key
```

Backend / Database:

```env
# Postgres connection (defaults to the value below if not set)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/halloween
PORT=3001
```

No Postgres? You can still run the full frontend flow without the backend. The animation is generated entirely in the browser.

## 🧭 How It Works

- **Upload**: `ImageUpload` reads images as base64 and stores them in state.
- **Filter selection**: `FilterSelector` lets users pick a spooky theme (UI-driven today; the image effects hook is wired for future expansion).
- **AI caption**: `GeminiRoast` calls Google’s Generative Language API using `VITE_GEMINI_API_KEY`, producing a caption aligned to the chosen theme and a user-set sass level.
- **Animation**: `useGifGenerator` turns the uploaded image into a short, dramatic video using `Canvas` + `MediaRecorder`. A jumpscare frame is blended in for flavor. Output is a blob URL (WebM/MP4 depending on browser support).
- **Preview & export**: `GifPreview` smartly renders the blob (video) and the UI offers download/share.

## 🏗️ Architecture

Frontend:

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui + Radix Primitives
- Toasts via `sonner`
- Router: `react-router-dom`

Backend (optional):

- Express + `pg` for Postgres
- Tables: `gifs (gif_data, filter_type)` and `roasts (gif_id, roast_text)`
- Auto-migrates on boot via `initDb()`

Project layout highlights:

- `src/pages/Index.tsx` — main page and user flow
- `src/components/` — UI pieces: `ImageUpload`, `FilterSelector`, `GeminiRoast`, `GifPreview`
- `src/hooks/useGifGenerator.ts` — canvas + MediaRecorder animation
- `server/index.ts` — Express server bootstrap
- `server/routes.ts` — API endpoints
- `server/pg.ts` — DB pool and schema init

## 🛠️ Scripts

```json
{
  "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
  "dev:client": "vite",
  "dev:server": "tsx watch server/index.ts",
  "server": "tsx server/index.ts",
  "build": "vite build",
  "build:dev": "vite build --mode development",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

## 🔌 API (Optional Backend)

Base URL: `http://localhost:3001`

- `POST /api/gifs`
  - Body: `{ gifBase64: string, filterType: string, roastText?: string }`
  - Stores animation (as bytes) and optional caption; returns `{ id }`.
- `GET /api/gifs/:id`
  - Returns raw `image/gif` bytes. Note: current frontend produces video via MediaRecorder; adapt as needed if you want GIFs.
- `GET /health`
  - Returns `{ status: "ok" }` when database is reachable.

Database schema (initialized at server start):

```sql
create extension if not exists pgcrypto;

create table if not exists gifs (
  id uuid primary key default gen_random_uuid(),
  gif_data bytea not null,
  filter_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists roasts (
  id uuid primary key default gen_random_uuid(),
  gif_id uuid references gifs(id) on delete cascade,
  roast_text text not null,
  created_at timestamptz not null default now()
);
```

## 🧪 Demo Flow

1) Upload a costume photo
2) Pick a filter and set a sass level
3) Generate AI caption
4) Generate animation and preview
5) Download and share

Tip for judges: the whole animation runs in-browser—no queue, no latency.

## 🗺️ Roadmap

- True GPU-accelerated filter effects per theme
- Export to GIF (in addition to WebM/MP4)
- Shareable permalink pages (persist to backend by default)
- Public gallery with likes and remixing
- Mobile-first export presets for social apps

## 🤝 Contributing

PRs welcome. Please:

- Keep code readable and typed
- Match existing formatting
- Add concise comments only where needed

## 📄 License

MIT © 2025 — Add your name or org

## 🙏 Credits

- Icons: `lucide-react`
- UI: `shadcn/ui`, Radix
- Toasts: `sonner`
- Build: Vite + TypeScript

Happy haunting and hacking! 🧙‍♀️

