-- Add timestamp tracking columns to watch_history
ALTER TABLE watch_history
    ADD COLUMN IF NOT EXISTS timestamp_seconds integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS duration_seconds integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS season integer,
    ADD COLUMN IF NOT EXISTS episode integer;

-- Ensure composite unique constraint exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'watch_history_user_id_media_id_key'
    ) THEN
        ALTER TABLE watch_history ADD CONSTRAINT watch_history_user_id_media_id_key UNIQUE (user_id, media_id);
    END IF;
END $$;

-- RLS: users can only read/write their own history
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'watch_history' AND policyname = 'Users can manage their own history') THEN
        CREATE POLICY "Users can manage their own history" ON watch_history
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;