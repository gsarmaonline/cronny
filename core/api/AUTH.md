# JWT Authentication Guide for Cronny

This document explains how to use the JWT authentication system implemented in Cronny.

## Overview

Cronny now uses JWT (JSON Web Tokens) for authentication. All protected endpoints require a valid JWT token in the Authorization header.

## Authentication Endpoints

### Register a New User

```
POST /api/cronny/v1/auth/register
```

Request Body:
```json
{
  "username": "your_username",
  "email": "your_email@example.com",
  "password": "your_password"
}
```

Response:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "your_username",
    "email": "your_email@example.com"
  }
}
```

### Login

```
POST /api/cronny/v1/auth/login
```

Request Body:
```json
{
  "username": "your_username",
  "password": "your_password"
}
```

Response:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "your_username",
    "email": "your_email@example.com"
  }
}
```

### Get Current User

```
GET /api/cronny/v1/auth/me
```

Headers:
```
Authorization: Bearer your_jwt_token
```

Response:
```json
{
  "user": {
    "id": 1,
    "username": "your_username",
    "email": "your_email@example.com"
  }
}
```

## Using Authentication with API Endpoints

All protected endpoints in Cronny require a valid JWT token in the Authorization header.

Example:

```bash
curl -X GET "http://127.0.0.1:8009/api/cronny/v1/schedules" \
  -H "Authorization: Bearer your_jwt_token"
```

## Testing Authentication

A test script is available at `/api/test_auth.sh`. This script:

1. Registers a new user
2. Logs in with the new user's credentials
3. Retrieves the user profile
4. Tests unauthorized access to a protected endpoint
5. Tests authorized access to various API endpoints

To run the test:

```bash
cd /path/to/cronny
chmod +x api/test_auth.sh
./api/test_auth.sh
```

## Configuration

JWT authentication can be configured in `config/config.go`:

- `JWTSecret`: The secret key used to sign JWT tokens (default: environment variable `JWT_SECRET` or a predefined fallback)
- `JWTExpiration`: The expiration time for JWT tokens (default: 24 hours)

In production, always set a strong, unique `JWT_SECRET` environment variable.

## Security Notes

1. All passwords are hashed using bcrypt before storage
2. JWT tokens expire after 24 hours by default
3. All protected routes require a valid JWT token
4. User information in JWT claims is minimal (only user ID)