# Didit Webhook Configuration

This document explains how to set up the Didit webhook to automatically sync KYC verification data with the Evyra platform.

## Overview

When Didit approves or rejects a KYC session, it sends a webhook request to our endpoint. This endpoint:
- Receives the verification result
- Extracts document and personal data
- Updates the user's profile with:
  - Birth date (kycBirthDate)
  - Nationality (kycNationality)
  - Document issue/expiry dates
  - Document issuer
  - Verification status (VERIFIED/REJECTED)
  - User status (PENDING → ACTIVE if approved)

## Webhook Endpoint

**URL:** `https://projetoevyrapt.vercel.app/api/webhooks/didit`

**Method:** POST

**Headers:**
- `Content-Type: application/json`
- `X-Didit-Signature: <HMAC-SHA256 signature>` (optional, for production)

## Expected Payload Format

```json
{
  "session_id": "145187c2-56e1-4636-8efd-bf54713c11e2",
  "status": "approved",
  "confidence": 0.99,
  "document": {
    "type": "driver_license",
    "number": "01536294680",
    "issue_date": "2000-05-26",
    "expiry_date": "2025-12-05",
    "issuer": "Detran-SP"
  },
  "person": {
    "first_name": "Adriano",
    "last_name": "Moreira da Silva",
    "birth_date": "1976-05-01",
    "nationality": "BRA"
  }
}
```

## Setup Steps in Didit Console

1. **Go to Didit Dashboard**
   - Navigate to your application settings
   - Find "Webhooks" or "Integrations" section

2. **Add Webhook Endpoint**
   - Endpoint URL: `https://projetoevyrapt.vercel.app/api/webhooks/didit`
   - Event type: KYC Session Completed / Verification Result
   - HTTP Method: POST

3. **Configure Signature Verification** (Production)
   - In Didit dashboard, copy your webhook secret
   - Set environment variable: `DIDIT_WEBHOOK_SECRET=your-secret-here`
   - Didit will sign requests with HMAC-SHA256

4. **Test the Webhook**
   - Didit provides a test button in the dashboard
   - Or manually trigger a KYC session completion in their sandbox

## Health Check

You can verify the webhook endpoint is live by making a GET request:

```bash
curl https://projetoevyrapt.vercel.app/api/webhooks/didit
```

Response:
```json
{
  "status": "ok",
  "message": "Didit webhook endpoint is active",
  "timestamp": "2026-04-05T18:30:00.000Z"
}
```

## Development

For development/staging with `DIDIT_WEBHOOK_SECRET=dev-secret`:
- Signature verification is **skipped**
- Useful for local testing

For production:
- Must configure proper webhook secret
- Signatures will be verified
- Requests without valid signatures will be rejected (401)

## Data Mapping

The webhook updates these User table fields:

| Didit Field | Database Column | Format |
|-------------|-----------------|--------|
| `person.birth_date` | `kycBirthDate` | ISO DateTime |
| `person.nationality` | `kycNationality` | String (BRA, PT, etc) |
| `document.issue_date` | `kycDocumentIssueDate` | ISO DateTime |
| `document.expiry_date` | `kycDocumentExpiryDate` | ISO DateTime |
| `document.issuer` | `kycDocumentIssuer` | String |
| `status` | `verificationStatus` | VERIFIED / REJECTED |
| Status: approved | `status` | ACTIVE (user account activated) |
| Full payload | `kycData` | JSON |

## Testing

To simulate a webhook from Didit (development only):

```bash
curl -X POST http://localhost:3000/api/webhooks/didit \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-id",
    "status": "approved",
    "confidence": 0.95,
    "document": {
      "type": "driver_license",
      "issue_date": "2000-05-26",
      "expiry_date": "2025-12-05",
      "issuer": "Detran-SP"
    },
    "person": {
      "first_name": "Test",
      "last_name": "User",
      "birth_date": "1990-01-01",
      "nationality": "BRA"
    }
  }'
```

## Debugging

Check application logs (Vercel runtime logs) for webhook processing:
- `[Didit Webhook] Successfully processed KYC...` - Success
- `[Didit Webhook] Invalid signature` - Security check failed
- `[Didit Webhook] No user found for session...` - Session ID mismatch

## Support

For Didit integration support, contact your Didit account manager or check their documentation at https://docs.didit.me
