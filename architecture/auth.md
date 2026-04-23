# Authentication and Database (Supabase)

## Goal
Implement a robust, production-ready Supabase authentication and database system for Nova Streaming.

## Requirements
- Full reset of the `novastreaming` project database via MCP.
- Creation of `profiles` and `watchlist` tables tightly coupled to `auth.users`.
- Strong Row Level Security (RLS) policies ensuring users can only read/write their own data.
- Trigger-based profile creation to auto-initialize user settings.

## Data Schemas
(See `gemini.md` for JSON shape of `profiles` and `watchlist`)

## Tools to Build (`tools/`)
1. `setup_db.py`: Connects via `mcp_supabase-mcp-server_execute_sql` to drop existing public schemas and apply fresh migrations.
2. `verify_db.py`: Validates RLS policies and connectivity constraints.

## Routing Logic
1. **Frontend**: Vite/React connects via `@supabase/supabase-js`.
2. **Backend**: Any admin modifications will use a Service Role Key, but currently only the frontend handles auth state directly.

## Edge Cases
- **Missing Passwords**: Disable email/password if using magic links, or enforce strong passwords.
- **Orphaned Watchlists**: Enforce `ON DELETE CASCADE` in PostgreSQL so deleting a user removes their watchlist.
