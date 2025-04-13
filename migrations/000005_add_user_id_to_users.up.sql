-- Add user_id column to users table for self-referencing
ALTER TABLE users ADD COLUMN user_id INTEGER;

-- Create an index on user_id
CREATE INDEX idx_users_user_id ON users(user_id);

-- Set user_id equal to id for existing users
UPDATE users SET user_id = id WHERE user_id IS NULL; 