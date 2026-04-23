-- Create watchlist table if it doesn't exist
CREATE TABLE IF NOT EXISTS watchlist (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_id text NOT NULL,
    media_type text NOT NULL,
    title text NOT NULL,
    category text,
    image text,
    added_at timestamptz DEFAULT now()
);

-- Unique constraint so we don't get duplicate entries
ALTER TABLE watchlist
    DROP CONSTRAINT IF EXISTS watchlist_user_media_unique;
ALTER TABLE watchlist
    ADD CONSTRAINT watchlist_user_media_unique UNIQUE (user_id, media_id);

-- Enable RLS
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Users can view own watchlist" ON watchlist;
CREATE POLICY "Users can view own watchlist"
    ON watchlist FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert to own watchlist" ON watchlist;
CREATE POLICY "Users can insert to own watchlist"
    ON watchlist FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete from own watchlist" ON watchlist;
CREATE POLICY "Users can delete from own watchlist"
    ON watchlist FOR DELETE
    USING (auth.uid() = user_id);
