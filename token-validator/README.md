# OHIF Token Validator Service

## Overview

This service provides JWT token validation for secure OHIF Viewer access. It acts as a Traefik ForwardAuth middleware to validate tokens before allowing access to studies.

## Features

- JWT token validation with RS256/HS256 support
- Study-specific access control
- IP restrictions and time-window constraints
- Rate limiting protection
- DCM4CHEE integration for study existence validation
- Comprehensive security headers
- Health check endpoint

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | - | Secret key for JWT verification |
| `DCM4CHEE_URL` | No | `http://dcm4chee:8080` | DCM4CHEE server URL |
| `DCM4CHEE_API_TOKEN` | No | - | API token for DCM4CHEE access |
| `VALIDATE_STUDY_EXISTENCE` | No | `false` | Enable study existence validation |
| `STRICT_STUDY_VALIDATION` | No | `false` | Fail if study validation unavailable |
| `PORT` | No | `3001` | Service port |
| `NODE_ENV` | No | `development` | Environment mode |

## API Endpoints

### GET /validate
Traefik ForwardAuth validation endpoint.

**Query Parameters:**
- `token`: JWT token to validate
- `StudyInstanceUIDs`: Comma-separated study UIDs to check access

**Headers:**
- `X-Forwarded-Token`: Alternative token source

**Response Headers:**
- `X-User-ID`: User identifier from token
- `X-User-Type`: Always "token" for token users
- `X-Study-Access`: JSON array of accessible study UIDs
- `X-Permissions`: JSON array of user permissions
- `X-Token-Valid`: "true" if validation successful

### POST /api/validate
Direct API token validation.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "studyInstanceUIDs": ["1.2.3.4.5", "1.2.3.4.6"],
  "clientIp": "192.168.1.100"
}
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "patient123",
    "type": "token",
    "studyAccess": ["1.2.3.4.5", "1.2.3.4.6"],
    "permissions": ["read"],
    "shareContext": {
      "sharedBy": "doctor123",
      "shareType": "patient"
    }
  }
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "token-validator",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Security Features

### Rate Limiting
- 100 requests per minute per IP address
- Returns 429 status when exceeded

### Token Security
- JWT signature verification
- Expiration time validation
- Required claims validation
- Study access permissions

### Request Validation
- IP address restrictions (if configured in token)
- Time window constraints
- Study existence verification (optional)

## Usage with Traefik

```yaml
# docker-compose.yml
services:
  token-validator:
    build: ./token-validator
    networks:
      - traefik_network
    environment:
      - JWT_SECRET=your-secret-here
      - DCM4CHEE_URL=http://dcm4chee:8080
    labels:
      - traefik.enable=true
      - traefik.http.services.token-validator.loadbalancer.server.port=3001

  ohif-viewer:
    # ... existing config ...
    labels:
      - traefik.http.middlewares.token-auth.forwardauth.address=http://token-validator:3001/validate
      - traefik.http.middlewares.token-auth.forwardauth.authResponseHeaders=X-User-ID,X-Study-Access,X-Permissions
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

## Docker Usage

```bash
# Build image
docker build -t ohif-token-validator .

# Run container
docker run -p 3001:3001 \
  -e JWT_SECRET=your-secret \
  -e DCM4CHEE_URL=http://dcm4chee:8080 \
  ohif-token-validator
```