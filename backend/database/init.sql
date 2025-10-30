-- ============================================
-- LexiLearn Database Schema (v1.1)
-- Clean, Scalable, No Seed Data
-- ============================================

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;

-- الإضافات
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1️⃣ USERS (المستخدمين)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id VARCHAR(150) UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  streak_current SMALLINT DEFAULT 0,
  streak_longest SMALLINT DEFAULT 0,
  last_active DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- 2️⃣ DAILY TOPICS (الدروس اليومية)
-- ============================================
CREATE TABLE daily_topics (
  id SERIAL PRIMARY KEY,
  day_number SMALLINT UNIQUE CHECK (day_number BETWEEN 1 AND 60),
  title_en VARCHAR(255) NOT NULL,
  level VARCHAR(10) CHECK (level IN ('A1','A2','B1','B2')),
  content TEXT,
  audio_url TEXT,
  estimated_minutes SMALLINT DEFAULT 10
);

-- ============================================
-- 3️⃣ TOPIC QUESTIONS (أسئلة كل درس)
-- ============================================
CREATE TABLE topic_questions (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES daily_topics(id) ON DELETE CASCADE,
  question_idx SMALLINT CHECK (question_idx BETWEEN 1 AND 6),
  prompt_en TEXT NOT NULL,
  answer_type VARCHAR(20) DEFAULT 'voice' CHECK (answer_type IN ('voice','text')),
  UNIQUE (topic_id, question_idx)
);

-- ============================================
-- 4️⃣ TOPIC WORDS (الكلمات الخاصة بكل درس)
-- ============================================
CREATE TABLE topic_words (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES daily_topics(id) ON DELETE CASCADE,
  term VARCHAR(100) NOT NULL,
  meaning TEXT,
  example TEXT,
  audio_url TEXT
);

-- ============================================
-- 5️⃣ SESSIONS (جلسة المحادثة)
-- ============================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES daily_topics(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status VARCHAR(15) DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  UNIQUE (user_id, topic_id)
);

-- ============================================
-- 6️⃣ ATTEMPTS (محاولة المستخدم للإجابة على سؤال)
-- ============================================
CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES topic_questions(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  UNIQUE (session_id, question_id)
);

-- ============================================
-- 7️⃣ UTTERANCES (التفاعل الصوتي/النصي)
-- ============================================
CREATE TABLE utterances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL CHECK (role IN ('user','ai')),
  text TEXT,
  audio_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_utterances_attempt ON utterances(attempt_id);

-- ============================================
-- 8️⃣ CORRECTIONS (تقييم الذكاء الصناعي)
-- ============================================
CREATE TABLE corrections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL UNIQUE REFERENCES attempts(id) ON DELETE CASCADE,
  feedback TEXT NOT NULL,
  fluency_score SMALLINT CHECK (fluency_score BETWEEN 0 AND 100),
  grammar_score SMALLINT CHECK (grammar_score BETWEEN 0 AND 100),
  vocab_score SMALLINT CHECK (vocab_score BETWEEN 0 AND 100),
  overall_score SMALLINT GENERATED ALWAYS AS (
    ROUND(
      (COALESCE(fluency_score,0) + 
       COALESCE(grammar_score,0) + 
       COALESCE(vocab_score,0)) / 3.0
    )
  ) STORED
);

-- ============================================
-- 9️⃣ LESSON SUMMARY
-- ============================================
CREATE TABLE lesson_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES daily_topics(id) ON DELETE CASCADE,
  avg_score NUMERIC(5,2),
  duration_minutes SMALLINT,
  total_attempts SMALLINT,
  completed_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 🔟 PROGRESS (الإحصاءات)
-- ============================================
CREATE TABLE progress (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  completed_lessons SMALLINT DEFAULT 0,
  avg_score NUMERIC(5,2) DEFAULT 0,
  total_active_days SMALLINT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 1️⃣1️⃣ NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- ============================================
-- 1️⃣2️⃣ USER VOCABULARY WORDS (دفتر الكلمات الخاص بكل مستخدم)
-- ============================================
CREATE TABLE user_vocab_words (
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

-- Index for faster queries by user
CREATE INDEX idx_user_vocab_words_user ON user_vocab_words(user_id);
-- Index for filtering by lesson
CREATE INDEX idx_user_vocab_words_lesson ON user_vocab_words(lesson);
-- Prevent duplicate words per user
CREATE UNIQUE INDEX idx_user_vocab_unique ON user_vocab_words(user_id, word);

-- ============================================
-- 💡 VIEW user_day_summary
-- ============================================
CREATE OR REPLACE VIEW user_day_summary AS
SELECT
  u.id AS user_id,
  dt.day_number,
  dt.title_en,
  s.status,
  COUNT(a.id) AS answered_questions,
  ROUND(COALESCE(AVG(c.overall_score), 0), 2) AS avg_score
FROM users u
LEFT JOIN sessions s ON s.user_id = u.id
LEFT JOIN daily_topics dt ON dt.id = s.topic_id
LEFT JOIN attempts a ON a.session_id = s.id
LEFT JOIN corrections c ON c.attempt_id = a.id
GROUP BY u.id, dt.day_number, dt.title_en, s.status;
