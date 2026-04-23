# Project Findings

## Environment
- **Root Directory:** `C:\Users\Owais\Downloads\nova main`
- **Git Status:** Not initialized in root.
- **GitHub CLI (gh):** Not installed.
- **Project Structure:**
  - Active: `nova-frontend`, `nova-backend`
  - Backups: Multiple `backup_nova_...` folders present.

## Constraints
- Must exclude heavy backup folders from the upload to keep the repo size manageable.
- Must ensure `.env` files are ignored.

## Anime API Platform Research (2026-03-14)
- **Outcome:** Metadata-focused API with 39,000+ titles.
- **Capabilities:** JSON metadata (titles, synopsis, genres, episode counts, status, ratings, airing dates, HQ images).
- **Performance:** <50ms response time.
- **Pricing:** Free tier (1,000 requests/month), Pro (€4/month).
- **Cons:** Does not provide direct streaming URLs (m3u8/mp4). Primarily for discovery and metadata enrichment.
- **Integration:** HTTP GET with API Key (generated upon registration).

## Local Launch Scripts (2026-03-24)
- **Frontend (`nova-frontend`):** `npm run dev` starts both Vite and a local Hono server (server/index.ts).
- **Backend (`nova-backend`):** Standalone Hono server (`src/index.ts`).
- **Redundancy:** The `server/index.ts` in the frontend seems to be the primary active backend script during local development.
