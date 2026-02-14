-- Drop the index
DROP INDEX IF EXISTS idx_users_user_id;

-- Remove user_id column from users table
ALTER TABLE users DROP COLUMN user_id; 