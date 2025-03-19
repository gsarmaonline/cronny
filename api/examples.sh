#!/bin/bash
#

URL="http://127.0.0.1:8009"
API_URL="$URL/api/cronny/v1"
AUTH_URL="$API_URL/auth"

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Cronny API Examples${NC}"
echo "===================="

# First, register a user
echo -e "\n${BLUE}1. Register a user:${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$AUTH_URL/register" \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "username": "exampleuser",
    "email": "example@example.com",
    "password": "password123"
  }')

echo "$REGISTER_RESPONSE" | jq '.'

# Extract token from response
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')

if [[ "$TOKEN" == "null" || "$TOKEN" == "" ]]; then
  echo "Registration failed. Trying to login instead..."
  
  # Try to login
  LOGIN_RESPONSE=$(curl -s -X POST "$AUTH_URL/login" \
    -H 'Content-Type: application/json' \
    --data-raw '{
      "username": "exampleuser",
      "password": "password123"
    }')
    
  # Extract token and user ID from response
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
  USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user.id')
  
  if [[ "$TOKEN" == "null" || "$TOKEN" == "" ]]; then
    echo "Login failed. Exiting."
    exit 1
  fi
fi

echo -e "\n${BLUE}Using token:${NC} ${TOKEN:0:20}... (truncated)"
echo -e "${BLUE}Using user ID:${NC} ${USER_ID}"

# Auth header for all subsequent requests
AUTH_HEADER="Authorization: Bearer $TOKEN"

# Job Template create
echo -e "\n${BLUE}2. Creating HTTP Job Template:${NC}"
curl -s -XPOST $API_URL/job_templates \
  -H "$AUTH_HEADER" \
  -H 'Content-Type: application/json' \
  --data @- << EOF | jq '.'
{
    "name": "http",
    "user_id": ${USER_ID}
}
EOF

# Job Template create
echo -e "\n${BLUE}3. Creating Slack Job Template:${NC}"
curl -s -XPOST $API_URL/job_templates \
  -H "$AUTH_HEADER" \
  -H 'Content-Type: application/json' \
  --data @- << EOF | jq '.'
{
    "name": "slack",
    "user_id": ${USER_ID}
}
EOF

# Action create
echo -e "\n${BLUE}4. Creating Action:${NC}"
curl -s -XPOST $API_URL/actions \
  -H "$AUTH_HEADER" \
  -H 'Content-Type: application/json' \
  --data @- << EOF | jq '.'
{
    "name": "action-1",
    "user_id": ${USER_ID}
}
EOF

# Job create
echo -e "\n${BLUE}5. Creating Job:${NC}"
curl -s -XPOST $API_URL/jobs \
  -H "$AUTH_HEADER" \
  -H 'Content-Type: application/json' \
  --data @- << EOF | jq '.'
{
    "name": "job-1",
    "action_id": 1,
    "job_input_type": "static_input",
    "job_input_value": "{\"method\": \"GET\", \"url\": \"https://jsonplaceholder.typicode.com/todos/1\"}",
    "is_root_job": true,
    "job_template_id": 1,
    "user_id": ${USER_ID}
}
EOF

# Schedule create
echo -e "\n${BLUE}6. Creating Schedule:${NC}"
curl -s -XPOST $API_URL/schedules \
  -H "$AUTH_HEADER" \
  -H 'Content-Type: application/json' \
  --data @- << EOF | jq '.'
{
    "name": "schedule-1",
    "schedule_type": 3,
    "schedule_value": "10",
    "schedule_unit": "second",
    "action_id": 1,
    "user_id": ${USER_ID}
}
EOF

# Schedule update
echo -e "\n${BLUE}7. Updating Schedule:${NC}"
curl -s -XPUT $API_URL/schedules/1 \
  -H "$AUTH_HEADER" \
  -H 'Content-Type: application/json' \
  --data @- << EOF | jq '.'
{
    "schedule_status": 1
}
EOF

# List all jobs
echo -e "\n${BLUE}9. Listing All Jobs:${NC}"
curl -s -X GET "$API_URL/jobs" \
  -H "$AUTH_HEADER" | jq '.'

# Get user profile
echo -e "\n${BLUE}10. Getting User Profile:${NC}"
curl -s -X GET "$API_URL/user/profile" \
  -H "$AUTH_HEADER" | jq '.'

# Update user profile
echo -e "\n${BLUE}11. Updating User Profile:${NC}"
curl -s -X PUT "$API_URL/user/profile" \
  -H "$AUTH_HEADER" \
  -H 'Content-Type: application/json' \
  --data @- << EOF | jq '.'
{
    "first_name": "John",
    "last_name": "Doe",
    "address": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "country": "USA",
    "zip_code": "94105",
    "phone": "+1-555-123-4567"
}
EOF

# Get available plans
echo -e "\n${BLUE}12. Getting Available Plans:${NC}"
curl -s -X GET "$API_URL/user/plans" \
  -H "$AUTH_HEADER" | jq '.'

# Update user plan
echo -e "\n${BLUE}13. Updating User Plan:${NC}"
curl -s -X PUT "$API_URL/user/plan" \
  -H "$AUTH_HEADER" \
  -H 'Content-Type: application/json' \
  --data @- << EOF | jq '.'
{
    "plan_id": 2
}
EOF

echo -e "\n${GREEN}All examples completed successfully!${NC}"
