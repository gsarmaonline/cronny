#!/bin/bash
#

URL="https://cronnyapi.fly.dev"

# Job Template create
curl -XPOST $URL/api/cronny/v1/job_templates -H 'Content-Type: application/json' --data @- << EOF
{
    "name": "http"
}
EOF

# Job Template create
curl -XPOST $URL/api/cronny/v1/job_templates -H 'Content-Type: application/json' --data @- << EOF
{
    "name": "slack"
}
EOF

# Action create
curl -XPOST $URL/api/cronny/v1/actions -H 'Content-Type: application/json' --data @- << EOF
{
    "name": "action-1"
}
EOF

# Job create
curl -XPOST $URL/api/cronny/v1/jobs -H 'Content-Type: application/json' --data @- << EOF
{
    "name": "job-1",
    "action_id": 1,
    "job_type": "http",
    "job_input_type": "static_input",
    "job_input_value": "{\"method\": \"GET\", \"url\": \"https://jsonplaceholder.typicode.com/todos/1\"}",
    "is_root_job": true,
    "job_template_id": 1
}
EOF

# Schedule create
curl -XPOST $URL/api/cronny/v1/schedules -H 'Content-Type: application/json' --data @- << EOF
{
    "name": "schedule-1",
    "schedule_type": 3,
    "schedule_value": "10",
    "schedule_unit": "minute",
    "action_id": 1
}
EOF

# Schedule update
curl -XPUT $URL/api/cronny/v1/schedules/1 -H 'Content-Type: application/json' --data @- << EOF
{
    "schedule_status": 1
}
EOF
