#!/bin/bash

URL="http://127.0.0.1:8009"
AUTH_URL="$URL/api/cronny/v1/auth"
API_URL="$URL/api/cronny/v1"

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}JWT Authentication Test Script${NC}"
echo "================================="

# Test registration
echo -e "\n${BLUE}1. Testing user registration:${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$AUTH_URL/register" \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }')

# Check if registration was successful
if [[ $REGISTER_RESPONSE == *"token"* ]]; then
  echo -e "${GREEN}Registration successful!${NC}"
  echo $REGISTER_RESPONSE | jq '.'
else
  echo -e "${RED}Registration failed:${NC}"
  echo $REGISTER_RESPONSE | jq '.'
fi

# Test login
echo -e "\n${BLUE}2. Testing user login:${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$AUTH_URL/login" \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "username": "testuser",
    "password": "password123"
  }')

# Extract token from login response
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [[ $TOKEN != "null" && $TOKEN != "" ]]; then
  echo -e "${GREEN}Login successful!${NC}"
  echo "Token received: ${TOKEN:0:20}... (truncated)"
else
  echo -e "${RED}Login failed:${NC}"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

# Test protected endpoint (user profile)
echo -e "\n${BLUE}3. Testing protected endpoint (user profile):${NC}"
ME_RESPONSE=$(curl -s -X GET "$AUTH_URL/me" \
  -H "Authorization: Bearer $TOKEN")

if [[ $ME_RESPONSE == *"username"* ]]; then
  echo -e "${GREEN}Access to protected endpoint successful!${NC}"
  echo $ME_RESPONSE | jq '.'
else
  echo -e "${RED}Access to protected endpoint failed:${NC}"
  echo $ME_RESPONSE | jq '.'
fi

# Test unauthorized access
echo -e "\n${BLUE}4. Testing unauthorized access:${NC}"
UNAUTH_RESPONSE=$(curl -s -X GET "$API_URL/schedules")

if [[ $UNAUTH_RESPONSE == *"Unauthorized"* || $UNAUTH_RESPONSE == *"error"* ]]; then
  echo -e "${GREEN}Unauthorized access properly rejected!${NC}"
  echo $UNAUTH_RESPONSE | jq '.'
else
  echo -e "${RED}WARNING: Unauthorized access was not properly rejected!${NC}"
  echo $UNAUTH_RESPONSE | jq '.'
fi

# Test authorized access
echo -e "\n${BLUE}5. Testing authorized access to schedules:${NC}"
AUTH_RESPONSE=$(curl -s -X GET "$API_URL/schedules" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}Response from protected endpoint:${NC}"
echo $AUTH_RESPONSE | jq '.'

echo -e "\n${BLUE}6. Creating a schedule with authorization:${NC}"
SCHEDULE_RESPONSE=$(curl -s -X POST "$API_URL/schedules" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "name": "auth-test-schedule",
    "schedule_type": 3,
    "schedule_value": "10",
    "schedule_unit": "second",
    "action_id": 1
  }')

echo -e "${GREEN}Create schedule response:${NC}"
echo $SCHEDULE_RESPONSE | jq '.'

echo -e "\n${BLUE}JWT Authentication Test Complete${NC}"