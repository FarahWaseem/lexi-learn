-- Migration: Create user_vocab_words table
-- This table stores user's personal vocabulary words

CREATE TABLE IF NOT EXISTS user_vocab_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson VARCHAR(255) NOT NULL,
  word VARCHAR(100) NOT NULL,
  translation VARCHAR(255) NOT NULL,
  example TEXT,
  audio_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure unique words per user
  UNIQUE(user_id, word)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_vocab_words_user_id ON user_vocab_words(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vocab_words_word ON user_vocab_words(word);
CREATE INDEX IF NOT EXISTS idx_user_vocab_words_lesson ON user_vocab_words(lesson);
CREATE INDEX IF NOT EXISTS idx_user_vocab_words_created_at ON user_vocab_words(created_at);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_vocab_words_updated_at 
    BEFORE UPDATE ON user_vocab_words 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
