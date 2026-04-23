# NOVA Streaming Platform

Premium anime & streaming platform with modern UI.

## Quick Start

### 1. Start Backend (Terminal 1)
```bash
cd nova-backend
bun run dev
```
Backend runs on `http://localhost:3030`

### 2. Start Frontend (Terminal 2)
```bash
cd nova-frontend
npm run dev
```
Frontend runs on `http://localhost:5173` (or 5174 if port busy)

## Features

- **Inicio** - Homepage with featured content, trending anime
- **Películas** - Movies with 4K/HDR badges, genre filters
- **Series** - TV shows with season info
- **Anime** - Anime catalog with search, filters
- **Deportes** - Live sports scores, upcoming events
- **Nova AI** - Fox chatbot assistant

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Bun + Hono
- **API**: anime-peach-eight.vercel.app

## Project Structure

```
nova main/
├── nova-backend/       # Hono API server
│   └── src/
│       ├── index.ts    # Server entry
│       └── routes/
│           └── anime.ts # Anime API routes
│
└── nova-frontend/      # React app
    └── src/
        ├── components/ # UI components
        ├── pages/      # Route pages
        └── App.tsx     # Router setup
```
