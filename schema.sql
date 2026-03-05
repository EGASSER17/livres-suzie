-- Script SQL à exécuter dans l'éditeur SQL de Supabase

CREATE TABLE recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  questionnaire JSONB NOT NULL,
  books JSONB NOT NULL
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_recs" ON recommendations
  FOR ALL USING (auth.uid() = user_id);

-- Index pour accélérer les requêtes par utilisateur
CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX idx_recommendations_created_at ON recommendations(created_at DESC);
