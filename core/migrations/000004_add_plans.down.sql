-- Remove plan_id from users table
ALTER TABLE users DROP COLUMN plan_id;

-- Drop plan_features junction table
DROP TABLE plan_features;

-- Drop features table
DROP TABLE features;

-- Drop plans table
DROP TABLE plans; 