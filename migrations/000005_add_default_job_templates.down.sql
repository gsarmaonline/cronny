-- Remove default job templates
DELETE FROM job_templates 
WHERE name IN ('HTTP Job', 'Slack Job', 'Logger Job', 'Docker Job'); 