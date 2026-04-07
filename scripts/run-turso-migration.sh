#!/bin/bash
# Run Turso migration to add demand management fields

# Turso credentials
TURSO_URL="libsql://idosolink-isanat.aws-us-east-1.turso.io"
TURSO_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzU0MTgyNDUsImlkIjoiNTEzMGFhMTAtOWY4YS00NmIzLWExZTQtMDVmYTdlMDlhNDNhIiwicmlkIjoiOTYyODk3ZGMtY2EyZi00MDZjLTk0NDctMjA0ZjMyNzY5M2JkIn0.e7ScWFne9EHwZ_Gt8827-Y1U01RwbYeVD0jeJ4dMFgkyny13lsWWOWbJ61SzFo2LzarAMcQVwoSIKPxGqRxgDg"

# Convert libsql URL to HTTP endpoint
HTTP_URL="${TURSO_URL//libsql:\/\//https:\/\/}"
HTTP_URL="${HTTP_URL%\?*}"  # Remove query string if present

echo "Running Turso migration..."
echo "URL: $HTTP_URL"

# SQL statements
SQL_STATEMENTS=(
  "ALTER TABLE \"Demand\" ADD COLUMN \"closedReason\" TEXT;"
  "ALTER TABLE \"Demand\" ADD COLUMN \"deletedAt\" DATETIME;"
  "ALTER TABLE \"Demand\" ADD COLUMN \"deletionReason\" TEXT;"
  "CREATE INDEX \"Demand_deletedAt_idx\" ON \"Demand\"(\"deletedAt\");"
)

# Execute each statement
for sql in "${SQL_STATEMENTS[@]}"; do
  echo "Executing: $sql"

  curl -X POST "$HTTP_URL/v2/pipeline" \
    -H "Authorization: Bearer $TURSO_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"requests\": [{\"type\": \"execute\", \"stmt\": {\"sql\": \"$sql\"}}]}" \
    -s | jq '.'

  echo ""
done

echo "Migration complete!"
