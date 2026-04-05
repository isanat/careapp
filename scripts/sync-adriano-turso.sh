#!/bin/bash

# Script to sync ADRIANO user using Turso API directly with curl
# This bypasses Node.js DNS resolution issues

TURSO_URL="libsql://idosolink-isanat.aws-us-east-1.turso.io"
TURSO_TOKEN="${TURSO_AUTH_TOKEN:-eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzU0MTgyNDUsImlkIjoiNTEzMGFhMTAtOWY4YS00NmIzLWExZTQtMDVmYTdlMDlhNDNhIiwicmlkIjoiOTYyODk3ZGMtY2EyZi00MDZjLTk0NDctMjA0ZjMyNzY5M2JkIn0.e7ScWFne9EHwZ_Gt8827-Y1U01RwbYeVD0jeJ4dMFgkyny13lsWWOWbJ61SzFo2LzarAMcQVwoSIKPxGqRxgDg}"

echo "🔄 Sincronizando usuário ADRIANO com Turso..."
echo "Database: idosolink-isanat"
echo ""

# Create a JSON file with the SQL insert
cat > /tmp/adriano_insert.json << 'EOF'
{
  "requests": [
    {
      "type": "execute",
      "stmt": {
        "sql": "INSERT INTO User (id, email, name, firstName, lastName, role, status, verificationStatus, kycSessionId, kycBirthDate, kycNationality, kycDocumentIssueDate, kycDocumentExpiryDate, kycDocumentIssuer, kycCompletedAt, kycData, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        "args": [
          "user_adriano_netlinkassist",
          "netlinkassist@gmail.com",
          "Adriano Moreira da Silva",
          "Adriano",
          "Moreira da Silva",
          "CAREGIVER",
          "ACTIVE",
          "VERIFIED",
          "145187c2-56e1-4636-8efd-bf54713c11e2",
          "1976-05-01T00:00:00Z",
          "BRA",
          "2000-05-26T00:00:00Z",
          "2025-12-05T00:00:00Z",
          "Detran-SP",
          "2026-04-05T19:30:00Z",
          "{\"email\":\"netlinkassist@gmail.com\",\"firstName\":\"Adriano\",\"lastName\":\"Moreira da Silva\",\"birthDate\":\"1976-05-01\",\"nationality\":\"BRA\",\"documentNumber\":\"01536294680\",\"documentType\":\"driver_license\",\"documentIssuer\":\"Detran-SP\",\"documentIssueDate\":\"2000-05-26\",\"documentExpiryDate\":\"2025-12-05\",\"syncedAt\":\"2026-04-05T19:30:00Z\"}",
          "2026-04-05T19:30:00Z",
          "2026-04-05T19:30:00Z"
        ]
      }
    }
  ]
}
EOF

echo "📤 Enviando para Turso..."
echo ""

# Make the request to Turso
RESPONSE=$(curl -s -X POST "https://idosolink-isanat.aws-us-east-1.turso.io/v2/pipeline" \
  -H "Authorization: Bearer $TURSO_TOKEN" \
  -H "Content-Type: application/json" \
  --data @/tmp/adriano_insert.json)

echo "Resposta:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

# Check if successful
if echo "$RESPONSE" | grep -q "success\|results"; then
  echo ""
  echo "✅ Usuário ADRIANO sincronizado com sucesso!"
  echo "  Email: netlinkassist@gmail.com"
  echo "  Role: CAREGIVER"
  echo "  Status: ACTIVE"
  echo "  KYC: VERIFIED"
  echo ""
  echo "🎉 Pronto para fazer login!"
else
  echo ""
  echo "❌ Erro ao sincronizar. Verifique a resposta acima."
  exit 1
fi

rm -f /tmp/adriano_insert.json
