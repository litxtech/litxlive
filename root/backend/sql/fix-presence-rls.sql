-- Fix RLS policies for presence and match_queue tables

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage own presence" ON presence;
DROP POLICY IF EXISTS "Users can view all presence" ON presence;
DROP POLICY IF EXISTS "Users can insert own presence" ON presence;
DROP POLICY IF EXISTS "Users can update own presence" ON presence;
DROP POLICY IF EXISTS "Users can manage own queue entry" ON match_queue;
DROP POLICY IF EXISTS "Users can insert own queue entry" ON match_queue;
DROP POLICY IF EXISTS "Users can delete own queue entry" ON match_queue;

-- Enable RLS
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_queue ENABLE ROW LEVEL SECURITY;

-- Presence policies: Allow users to manage their own presence
CREATE POLICY "Users can insert own presence" ON presence
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence" ON presence
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all presence" ON presence
  FOR SELECT
  USING (true);

-- Match queue policies: Allow users to manage their own queue entry
CREATE POLICY "Users can insert own queue entry" ON match_queue
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own queue entry" ON match_queue
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own queue entry" ON match_queue
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create or replace the enqueue_for_match function with proper security
CREATE OR REPLACE FUNCTION enqueue_for_match()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the authenticated user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Ensure presence row exists
  INSERT INTO presence (user_id, in_call, last_seen)
  VALUES (v_user_id, true, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET in_call = true, last_seen = NOW();

  -- Insert into match queue (remove duplicates first)
  DELETE FROM match_queue WHERE user_id = v_user_id;
  
  INSERT INTO match_queue (user_id, joined_at)
  VALUES (v_user_id, NOW());
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION enqueue_for_match() TO authenticated;
