-- Migration: Add clerk_user_id column to users table
-- Date: 2025-10-30

-- Add clerk_user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'clerk_user_id'
  ) THEN
    ALTER TABLE users ADD COLUMN clerk_user_id VARCHAR(150) UNIQUE;
    RAISE NOTICE 'clerk_user_id column added successfully';
  ELSE
    RAISE NOTICE 'clerk_user_id column already exists';
  END IF;
END $$;

