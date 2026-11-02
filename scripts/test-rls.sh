#!/usr/bin/env bash
# Lance un Postgres jetable, applique les migrations et vérifie la RLS.
# Usage : npm run test:rls
set -euo pipefail
cd "$(dirname "$0")/.."
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
DIR="$(pwd)/.pgtest"
PORT=54329
rm -rf "$DIR"; mkdir -p "$DIR"
# Postgres refuse de tourner en root : on passe par l'utilisateur "postgres" si besoin.
AS=()
if [ "$(id -u)" = "0" ]; then chown postgres "$DIR"; AS=(runuser -u postgres --); fi
"${AS[@]}" "$PGBIN/initdb" -D "$DIR/data" -U postgres -A trust >/dev/null
"${AS[@]}" "$PGBIN/pg_ctl" -D "$DIR/data" -o "-p $PORT -k $DIR -c listen_addresses=''" -l "$DIR/log" start >/dev/null
trap '"${AS[@]}" "$PGBIN/pg_ctl" -D "$DIR/data" stop -m fast >/dev/null; rm -rf "$DIR"' EXIT
PSQL=(psql -X -q -v ON_ERROR_STOP=1 -h "$DIR" -p $PORT -U postgres -d postgres)
"${PSQL[@]}" -f supabase/tests/stub_supabase.sql
for f in supabase/migrations/*.sql; do "${PSQL[@]}" -f "$f"; done
"${PSQL[@]}" -f supabase/tests/rls_test.sql
