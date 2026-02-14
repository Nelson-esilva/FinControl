#!/bin/sh
set -e
npx prisma migrate deploy
node dist/seed.js 2>/dev/null || true
exec node dist/main.js
