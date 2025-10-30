-- Migration: Create user vocab words table
-- Run this migration if you already have the database initialized
-- Otherwise, just run init.sql which now includes this table

-- Create user_vocab_words table
CREATE TABLE IF NOT EXISTS user_vocab_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson VARCHAR(255),
  word VARCHAR(255) NOT NULL,
  translation VARCHAR(255),
  example TEXT,
  audio_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_vocab_words_user ON user_vocab_words(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vocab_words_lesson ON user_vocab_words(lesson);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_vocab_unique ON user_vocab_words(user_id, word);
