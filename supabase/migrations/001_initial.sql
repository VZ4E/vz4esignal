-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Scans table: stores each TikTok brand-detection scan
CREATE TABLE IF NOT EXISTS scans (
  id              UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tiktok_url      TEXT        NOT NULL,
  video_title     TEXT,
  video_author    TEXT,
  video_thumbnail TEXT,
  transcript      TEXT,
  brands          JSONB       DEFAULT '[]'::jsonb,
  raw_analysis    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Row Level Security
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scans"
  ON scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans"
  ON scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scans"
  ON scans FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast per-user history queries
CREATE INDEX IF NOT EXISTS scans_user_id_created_at_idx
  ON scans (user_id, created_at DESC);
