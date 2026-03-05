-- À exécuter dans Supabase SQL Editor

CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES recommendations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  book JSONB NOT NULL
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
