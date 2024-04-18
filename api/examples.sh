#!/bin/bash

## Job create
#curl -XPOST http://127.0.0.1:8009/api/cronny/v1/jobs -H 'Content-Type: application/json' --data @- << EOF
#{
#    "name": "job-1",
#    "action_id": 1,
#    "job_type": "http",
#    "job_input_type": "static_input",
#    "job_input_value": "{\"method\": \"GET\", \"url\": \"https://jsonplaceholder.typicode.com/todos/1\"}"
#}
#EOF

## Job update
#curl -XPUT http://127.0.0.1:8009/api/cronny/v1/jobs/5 -H 'Content-Type: application/json' --data @- << EOF
#{
#    "name": "job-5",
#    "action_id": 1,
#    "job_type": "http",
#    "job_input_type": "static_input",
#    "job_input_value": "{\"method\": \"GET\", \"url\": \"https://jsonplaceholder.typicode.com/todos/1\"}"
#}
#EOF

## Action create
#curl -XPOST http://127.0.0.1:8009/api/cronny/v1/actions -H 'Content-Type: application/json' --data @- << EOF
#{
#    "name": "action-2"
#}
#EOF

## Action update
#curl -XPUT http://127.0.0.1:8009/api/cronny/v1/actions/5 -H 'Content-Type: application/json' --data @- << EOF
#{
#    "name": "job-5",
#    "action_id": 1,
#    "job_type": "http",
#    "job_input_type": "static_input",
#    "job_input_value": "{\"method\": \"GET\", \"url\": \"https://jsonplaceholder.typicode.com/todos/1\"}"
#}
#EOF

# Schedule create
curl -XPOST http://127.0.0.1:8009/api/cronny/v1/schedules -H 'Content-Type: application/json' --data @- << EOF
{
    "name": "schedule-2",
    "schedule_type": 3,
    "schedule_value": "10",
    "schedule_unit": "second",
    "action_id": 2
}
EOF
