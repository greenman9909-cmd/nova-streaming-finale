# Nova Stream - AI Master Training Specification

> [!IMPORTANT]
> This document is the **Master Training Set** for the Nova Stream ecosystem. It contains every technical, architectural, and design rule currently active in the codebase. **Zero old data included.**

## 💠 1. Architectural Core (THE A.N.T. SYSTEM)
The project is built on the **B.L.A.S.T.** (Blueprint, Link, Architect, Stylize, Trigger) protocol and managed via the **A.N.T.** layers:

1.  **Architecture (`architecture/`)**: The Layer 1 "Brain". Contains technical SOPs. Business logic **must** be documented here before being coded.
2.  **Navigation (LLM Reasoning)**: The decision layer. The LLM connects SOPs to Tools.
3.  **Tools (`tools/`)**: Deterministic execution units (Python/TS). Atomic and testable.

## ⚙️ 2. Technology Stack & Infrastructure
-   **Runtime**: [Bun](https://bun.sh) (Backend) | Node 20+ (Frontend Build).
-   **Frontend**: [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/).
-   **Backend**: [Hono](https://hono.dev/) (Ultra-fast web framework).
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Remix Icons](https://remixicon.com/).
-   **Database/Auth**: [Supabase](https://supabase.com/).
-   **APIs**:
    -   **TMDB Proxy**: Frontend calls `/api/tmdb` (No direct API keys in frontend).
    -   **Sports Proxy**: Frontend calls `/api/sports` -> [Streamed.pk](https://streamed.pk) (Custom normalization).
    -   **Metadata**: TMDB for movies/series; Custom service for sports.

## 🎨 3. UI/UX & Design Constitutional Rules
-   **Color Palette**:
    -   **Background**: `#0a0a0f` (Solid Black-Blue transition).
    -   **Primary Brand**: `#00a8e1` (Nova Cyan).
    -   **Secondary Surface**: `#425265` (Slate Gray-Blue for buttons/cards).
-   **Typography**:
    -   **Hero Titles**: `Bebas Neue` (Uppercase, Tracking-wide, Leading `0.95`).
    -   **Body/UI**: `Inter` / `Outfit` / `Roboto`.
-   **Layout Constraints**:
    -   **Global Horizontal Padding**: `px-[4%] md:px-[5%]` for all content rows and hero text.
    -   **Hero Height**: `86vh` (Optimized for desktop/laptop).
-   **Blended Aesthetic**: Prime Video inspired hero with sharp, cinematic transitions.

## 🔐 4. Data Logic & Security
-   **The "Data-First" Rule**: Payload confirmation in `gemini.md` is required before tool construction.
-   **Auth Flow**:
    -   **Supabase Auth**: Strictly Email/Password. No Social Logins.
    -   **Profiles**: Up to 4 profiles per user. `is_kid` flag affects content filtering.
    -   **Watchlist**: Persistent database storage with RLS (Row Level Security).
-   **Proxy Logic**:
    -   **Backend Cache**: 5-minute TTL (`CACHE_TTL_MS`) for TMDB requests to reduce rate limits.
    -   **Frontend Cache**: Disabled. Always fetch fresh data to avoid UI drift.
-   **Sports Validator**:
    -   **45s Backoff**: If the sports backend fails, the service stops polling for 45s (`sportsBackendBackoffMs`) to prevent server hammering.
    -   **Verification**: All match streams are verified with a 1.5s timeout logic before the player initializes.

## 🚀 5. Component Registry
-   **`DynamicHeroBanner.tsx`**: Randomized logic, 1.5s delayed YouTube background playback, no hover scale on titles.
-   **`ContentRow.tsx`**: Horizontal scrolling carousel with unified `px-[4%]` padding. Scales `1.05` on hover.
-   **`Deportes.tsx`**: Specialized sports engine with categorized rows and live validation badges.
-   **`Jotform Chatbox`**: Global agent injected via `index.html` script.

## 📑 6. Operational Protocols for AI
1.  **Halt on Discovery**: Never build tools before Phase 1 questions are confirmed.
2.  **Self-Healing Loop**: Analyzes, patches, resets tool, and *only then* updates the SOP to prevent regression.
3.  **Local vs Global**: Use `.tmp/` for intermediates; Cloud for payloads.
4.  **No Placeholders**: Always use `generate_image` or real asset links.

---
*Status: Production Ready | Architecture Version: 2.1.0*
