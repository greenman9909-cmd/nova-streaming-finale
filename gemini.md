# Nova Main - Project Constitution

> [!IMPORTANT]
> **Recovery Guide:** See [RECOVERY_GUIDE.md](file:///C:/Users/Owais/Downloads/nova%20main/RECOVERY_GUIDE.md) for instructions on how to re-point Antigravity to this project if you reinstall or move machines.

## 🟢 Data Schemas

### Payload: Execution State (JSON)
```json
{
  "frontend": {
    "status": "running" | "stopped",
    "url": "http://localhost:5173",
    "engine": "Vite"
  },
  "backend": {
    "status": "running" | "stopped",
    "url": "http://localhost:3000",
    "engine": "Node/Express"
  }
}
```

### Payload: Direct Movie Stream (JSON)
```json
{
  "success": true,
  "sources": [
    {
      "url": "https://example.com/stream.m3u8",
      "quality": "1080p",
      "isM3U8": true
    }
  ],
  "subtitles": [
    {
      "url": "https://example.com/sub.vtt",
      "lang": "English"
    }
  ]
}
```

### Auth & Database: Supabase Schema (PostgreSQL)

**Table: `profiles`** (Multi-profile support per user, linking to `auth.users`)
```json
{
  "id": "uuid (PK, gen_random_uuid())",
  "user_id": "uuid (FK → auth.users.id, ON DELETE CASCADE)",
  "name": "text (nullable)",
  "avatar_url": "text (nullable)",
  "is_kid": "boolean (default false)",
  "preferences": "jsonb (default '{}')",
  "created_at": "timestamptz (default now())",
  "updated_at": "timestamptz (default now())"
}
```
*RLS: Enabled. Users scoped to own rows via `auth.uid() = user_id`.*

**Table: `watchlist`** (User watchlists with upsert support)
```json
{
  "id": "uuid (PK, gen_random_uuid())",
  "user_id": "uuid (FK → auth.users.id, ON DELETE CASCADE)",
  "content_id": "integer (legacy TMDB ID)",
  "content_type": "text ('movie' | 'series' | 'anime')",
  "media_id": "text (nullable, used for upsert)",
  "media_type": "text (nullable, 'movie' | 'tv')",
  "title": "text (nullable)",
  "category": "text (nullable)",
  "image": "text (nullable)",
  "poster_path": "text (nullable)",
  "added_at": "timestamptz (default now())",
  "UNIQUE": "(user_id, media_id)"
}
```
*RLS: Enabled. Users scoped to own rows.*

**Table: `watch_history`** (Tracks watch progress across movies/series/anime)
```json
{
  "id": "uuid (PK, gen_random_uuid())",
  "user_id": "uuid (NOT NULL, FK → auth.users.id, ON DELETE CASCADE)",
  "media_id": "text (NOT NULL)",
  "media_type": "text (NOT NULL, 'movie' | 'tv' | 'anime')",
  "title": "text (nullable)",
  "image": "text (nullable)",
  "progress": "integer (default 0, CHECK 0-100)",
  "updated_at": "timestamptz (default now())",
  "UNIQUE": "(user_id, media_id)"
}
```
*RLS: Enabled. Full CRUD scoped to `auth.uid() = user_id`. Indexed on `(user_id, updated_at DESC)`.*

**Table: `user_settings`** (Synced user preferences — autoplay, language, theme, etc.)
```json
{
  "user_id": "uuid (PK, FK → auth.users.id, ON DELETE CASCADE)",
  "settings": "jsonb (default '{}')",
  "updated_at": "timestamptz (default now())"
}
```
*RLS: Enabled. SELECT/INSERT/UPDATE scoped to `auth.uid() = user_id`.*

**Table: `leads`** (Newsletter/Waitlist signups via EmailPopup)
```json
{
  "id": "uuid (PK, gen_random_uuid())",
  "email": "text (UNIQUE, NOT NULL)",
  "source": "text (default 'EmailPopup')",
  "created_at": "timestamptz (default now())"
}
```
*RLS: Enabled. INSERT allowed for `anon`, SELECT restricted.*

**Table: `notifications`** (In-app user notifications)
```json
{
  "id": "uuid (PK, gen_random_uuid())",
  "user_id": "uuid (FK → auth.users.id, ON DELETE CASCADE)",
  "title": "text (NOT NULL)",
  "message": "text (nullable)",
  "icon": "text (nullable)",
  "link": "text (nullable)",
  "read": "boolean (default false)",
  "created_at": "timestamptz (default now())"
}
```
*RLS: Enabled. Full CRUD scoped to `auth.uid() = user_id`.*

**Table: `subscriptions`** (Stripe subscription tracking)
```json
{
  "id": "uuid (PK, gen_random_uuid())",
  "user_id": "uuid (FK → auth.users.id, ON DELETE CASCADE)",
  "stripe_customer_id": "text (nullable)",
  "stripe_subscription_id": "text (nullable)",
  "plan_id": "text ('basic' | 'standard' | 'nova-plus')",
  "status": "text ('active' | 'canceled' | 'past_due' | 'unpaid')",
  "current_period_end": "timestamptz",
  "created_at": "timestamptz (default now())"
}
```
*RLS: Enabled. Full CRUD scoped to `auth.uid() = user_id`.*

### Input: Project Files
- **Location:** `C:\Users\Owais\Downloads\nova main`
- **Components:**
  - `nova-frontend/`: Vite/React frontend
  - `nova-backend/`: Node.js backend

## 🏗️ Architectural Invariants
1. **Security:** No secrets (`.env`, keys) in GitHub.
2. **Cleanliness:** No `node_modules`, `.tmp`, or `backup_` folders in GitHub.
3. **Connectivity:** Use standard `git` CLI flows.

## 🛠️ Behavioral Rules
1. Always verify `.gitignore` before initial commit.
2. Confirm with the user before pushing.
3. Use clear, descriptive commit messages.

## 📓 Maintenance Log (Phase 5 Trigger)
- **[2026-03-12] Supabase Architecture Reset:** Executed Phase 3 database wipe via MCP. `public.profiles` and `public.watchlist` created with robust Row Level Security (RLS) policies enforcing auth.uid() scoping. 
- **[2026-03-12] Auth Trigger:** Implemented `handle_new_user()` trigger mapping `auth.users` to `public.profiles` upon signup.
- **[2026-03-12] Frontend Stylization:** Edited `Login.tsx` and `Signup.tsx` to strictly enforce Email/Password combinations per user request, removing unused Social Login placeholders. TypeScript errors fixed. Build is deterministic (v1.0.0 passing).
- **[2026-03-31] Supabase Schema Completion:** Created `watch_history` and `user_settings` tables via MCP. Added `UNIQUE(user_id, media_id)` constraint to `watchlist` for upsert support. All 4 tables verified with RLS enabled. Updated `gemini.md` to document full schema.

- **[2026-04-06] Stripe Integration (Subscriptions):** Initialized `public.subscriptions` table in Supabase connected to `auth.users` with RLS. Configured Node/Express backend (`/api/stripe`) with Stripe Node SDK for dynamic checkout session generation and Webhook fulfillment (`checkout.session.completed`). Connected `Plans.tsx` dynamic prices to backend Checkout redirect logic.
