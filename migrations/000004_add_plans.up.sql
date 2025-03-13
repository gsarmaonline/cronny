-- Create features table
CREATE TABLE features (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create plans table
CREATE TABLE plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create plan_features junction table
CREATE TABLE plan_features (
    plan_id INTEGER REFERENCES plans(id) ON DELETE CASCADE,
    feature_id INTEGER REFERENCES features(id) ON DELETE CASCADE,
    PRIMARY KEY (plan_id, feature_id)
);

-- Add plan_id to users table
ALTER TABLE users ADD COLUMN plan_id INTEGER DEFAULT 1 REFERENCES plans(id);

-- Insert default features
INSERT INTO features (name, description) VALUES
    ('Up to 10 jobs', 'Create and manage up to 10 jobs'),
    ('Basic scheduling', 'Basic scheduling capabilities'),
    ('Email notifications', 'Email notifications for job status'),
    ('Community support', 'Community-based support'),
    ('Unlimited jobs', 'Create and manage unlimited jobs'),
    ('Advanced scheduling', 'Advanced scheduling capabilities'),
    ('Slack notifications', 'Slack integration for notifications'),
    ('Priority support', 'Priority customer support'),
    ('Custom webhooks', 'Custom webhook integrations'),
    ('API access', 'Full API access'),
    ('Dedicated support', 'Dedicated customer support team'),
    ('Custom integrations', 'Custom integration development'),
    ('SLA guarantees', 'Service Level Agreement guarantees'),
    ('Advanced security', 'Advanced security features'),
    ('Team management', 'Team and user management');

-- Insert default plans
INSERT INTO plans (name, type, price, description) VALUES
    ('Starter', 'starter', 0, 'Perfect for small projects'),
    ('Pro', 'pro', 29, 'For growing teams'),
    ('Enterprise', 'enterprise', 0, 'For large organizations');

-- Link features to plans
INSERT INTO plan_features (plan_id, feature_id)
SELECT p.id, f.id
FROM plans p
CROSS JOIN features f
WHERE (p.type = 'starter' AND f.name IN ('Up to 10 jobs', 'Basic scheduling', 'Email notifications', 'Community support'))
   OR (p.type = 'pro' AND f.name IN ('Unlimited jobs', 'Advanced scheduling', 'Slack notifications', 'Priority support', 'Custom webhooks', 'API access'))
   OR (p.type = 'enterprise' AND f.name IN ('Everything in Pro', 'Dedicated support', 'Custom integrations', 'SLA guarantees', 'Advanced security', 'Team management')); 