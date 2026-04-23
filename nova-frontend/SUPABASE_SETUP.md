**Supabase Setup**
Follow these steps to make login and signup work end-to-end.

1. Create or open your Supabase project.
2. Go to the SQL Editor and run the schema in `supabase/schema.sql`.
3. In Supabase Auth settings:
   - Enable Email/Password provider.
   - Add your site URL to Redirect URLs (e.g. `http://localhost:5173`).
4. Ensure `.env` has your project values:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

That is all the frontend needs to authenticate and store profiles, watchlist, watch history, and settings.
