-- Add default job templates
INSERT INTO job_templates (name, exec_type, exec_link, code, created_at, updated_at)
VALUES 
('HTTP Job', 1, 'http', '{"url": "https://api.example.com", "method": "POST", "headers": {"Content-Type": "application/json"}, "body": {"key": "value"}}', NOW(), NOW()),
('Slack Job', 2, 'slack', '{"webhook_url": "https://hooks.slack.com/...", "message": "Hello from Cronny!"}', NOW(), NOW()),
('Logger Job', 3, 'logger', '{"message": "This is a log message"}', NOW(), NOW()),
('Docker Job', 4, 'docker', '{"image": "ubuntu:latest", "command": ["echo", "hello world"]}', NOW(), NOW()); 