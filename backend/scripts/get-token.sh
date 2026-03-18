#!/bin/bash
# Get JWT token for testing
# Usage: TOKEN=$(./scripts/get-token.sh)

curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ark.io","password":"admin123456"}' | \
  grep -o '"accessToken":"[^"]*"' | \
  cut -d'"' -f4
