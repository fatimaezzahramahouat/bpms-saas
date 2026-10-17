#!/bin/sh
set -e

echo "=============================================="
echo "BPMS backend starting"
echo "  NODE_ENV:           ${NODE_ENV:-<unset>}"
echo "  PORT:               ${PORT:-<unset, defaults to 5000>}"
echo "  DATABASE_URL set:   $([ -n "$DATABASE_URL" ] && echo YES || echo 'NO')"
echo "  DIRECT_URL set:     $([ -n "$DIRECT_URL" ] && echo YES || echo 'NO')"
echo "=============================================="

if [ -z "$DATABASE_URL" ] || [ -z "$DIRECT_URL" ]; then
  echo "FATAL: DATABASE_URL and DIRECT_URL must be set as environment variables."
  echo "  On Back4app: App -> Settings -> Environment Variables."
  exit 1
fi

echo "Applying database migrations..."
if timeout 120 npx prisma migrate deploy; then
  echo "Migrations OK"
else
  echo "MIGRATION FAILED or timed out after 120s. The server will not start."
  echo "Check your Back4app environment variables:"
  echo "  DATABASE_URL -> transaction pooler: ...pooler.supabase.com:6543/postgres?pgbouncer=true"
  echo "  DIRECT_URL   -> session pooler:     ...pooler.supabase.com:5432/postgres"
  echo "Do NOT use the :6543 pooler in DIRECT_URL (migrations hang there)."
  exit 1
fi

echo "Starting server on 0.0.0.0:${PORT:-5000}"
exec node dist/server.js
