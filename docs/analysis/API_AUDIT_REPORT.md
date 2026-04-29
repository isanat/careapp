# API Audit Report - User Profile Endpoint
## Data Flow & Current Implementation Analysis

**Date:** April 29, 2026  
**File:** `/src/app/api/user/profile/route.ts` (326 lines)  
**Status:** Production-ready, well-documented

---

## 🔍 **GET /api/user/profile**

### Request
```
GET /api/user/profile
Headers: Authorization (via session)
```

### Response Structure
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "phone": "string",
    "role": "CAREGIVER | FAMILY",
    "status": "string",
    "profileImage": "string | null",
    "nif": "string",
    "documentType": "CC | PASSPORT | RESIDENCE",
    "documentNumber": "string",
    "backgroundCheckStatus": "PENDING | VERIFIED | FAILED",
    "backgroundCheckUrl": "string | null"
  },
  "profile": {
    // All fields from User, ProfileFamily, and ProfileCaregiver
    // (66+ fields total)
  }
}
```

### Data Sources (SQL Join)
```sql
SELECT u.*, pf.*, pc.*
FROM User u
LEFT JOIN ProfileFamily pf ON u.id = pf.userId
LEFT JOIN ProfileCaregiver pc ON u.id = pc.userId
WHERE u.id = ?
```

### Key Observations
- **Scope:** Returns ALL fields from all 3 tables (wasteful, but safe)
- **Merging:** Simple flat object, no nesting by role
- **Completeness:** Works for both roles (LEFT JOIN handles missing profile rows)
- **Performance:** OK for single user fetch, but N+1 issue if fetched in lists

---

## 🔄 **PUT /api/user/profile**

### Request Body
```json
{
  // User table fields (optional)
  "name": "string",
  "phone": "string",
  "profileImage": "string",
  "nif": "string",
  "documentType": "CC | PASSPORT | RESIDENCE",
  "documentNumber": "string",
  
  // ProfileFamily fields (optional)
  "address": "string",
  "city": "string",
  "country": "string",
  "postalCode": "string",
  "elderName": "string",
  "elderAge": "number",
  "elderNeeds": "string",
  "emergencyContactName": "string",
  "emergencyContactPhone": "string",
  "emergencyContactRelation": "string",
  
  // ProfileCaregiver fields (optional)
  "title": "string",
  "bio": "string",
  "experienceYears": "number",
  "education": "string",
  "certifications": "string",
  "languages": "array (JSON stringified)",
  "city": "string",
  "country": "string",
  "services": "array (JSON stringified)",
  "hourlyRateEur": "number (€ decimal, stored as cents)"
}
```

### Response
```json
{
  "success": true,
  "message": "Profile updated"
}
```

### Update Logic
1. **User Table** - Updates if any User field provided
2. **ProfileFamily Table** - Updates if any Family field provided
3. **ProfileCaregiver Table** - Updates if any Caregiver field provided
4. **Auto-create:** Uses INSERT OR IGNORE to create profile rows if missing

### Special Cases

**Languages (Caregiver)**
```typescript
// Lines 272-275
if (body.languages !== undefined) {
  caregiverUpdates.push("languages = ?");
  caregiverValues.push(body.languages);  // ⚠️ Expects JSON array or string
}
```
- Frontend sends array: `["Português", "English"]`
- API doesn't stringify, just passes through
- **Note:** Inconsistent with services (which IS stringified on line 286)

**Services (Caregiver)**
```typescript
// Lines 284-287
if (body.services !== undefined) {
  caregiverUpdates.push("services = ?");
  caregiverValues.push(JSON.stringify(body.services));  // ✓ Properly stringified
}
```
- Frontend sends array
- API stringifies before storing
- Correct pattern

**Hourly Rate (Caregiver)**
```typescript
// Lines 288-291
if (body.hourlyRateEur !== undefined) {
  caregiverUpdates.push("hourlyRateEur = ?");
  caregiverValues.push(Math.round(body.hourlyRateEur * 100));  // ✓ Cents
}
```
- Frontend sends decimal (e.g., 18.50)
- API converts to cents (1850) before storing
- ✓ Correct pattern

**Auto-create ProfileCaregiver**
```typescript
// Lines 294-298
await db.execute({
  sql: `INSERT OR IGNORE INTO ProfileCaregiver (id, userId, hourlyRateEur, createdAt, updatedAt) 
        VALUES (?, ?, 0, ?, ?)`,
  args: [`pc_${session.user.id}`, session.user.id, now, now],
});
```
- Ensures row exists before updating
- Sets initial hourlyRateEur to 0
- ID format: `pc_{userId}`
- ✓ Correct pattern

**Auto-create ProfileFamily**
```typescript
// Lines 311-316
if (familyUpdates.length > 0) {
  await db.execute({
    sql: `INSERT OR IGNORE INTO ProfileFamily (id, userId, createdAt, updatedAt) 
          VALUES (?, ?, ?, ?)`,
    args: [`pf_${session.user.id}`, session.user.id, now, now],
  });
}
```
- Only creates if there are updates
- ID format: `pf_{userId}`
- ✓ Correct pattern

---

## ⚠️ **Issues & Limitations Identified**

### Issue 1: Languages Field Inconsistency
**Severity:** Low  
**Location:** Lines 272-275  

**Problem:**
- Services: Properly stringified with `JSON.stringify()`
- Languages: Passed as-is (expects JSON already)

**Impact:** 
- If frontend sends array, it'll store as string representation of array
- If frontend sends JSON string, works correctly
- Frontend inconsistency could cause bugs

**Solution:**
```typescript
// Should be:
if (body.languages !== undefined) {
  caregiverUpdates.push("languages = ?");
  caregiverValues.push(JSON.stringify(Array.isArray(body.languages) ? body.languages : JSON.parse(body.languages)));
}
```

---

### Issue 2: No Role-Specific Validation
**Severity:** Medium  
**Location:** Entire PUT handler (149-326)  

**Problem:**
- Endpoint accepts all fields regardless of user's role
- A FAMILY user could send caregiver fields (title, services, hourlyRateEur)
- These would silently create/update ProfileCaregiver row (wrong!)
- A CAREGIVER user could send family fields (elderName, elderAge)
- These would create/update ProfileFamily row (wrong!)

**Impact:**
- Possible data corruption
- Wrong profile tables created for wrong roles
- No audit trail of cross-role updates

**Solution:**
```typescript
// Should add:
if (session.user.role === "FAMILY") {
  // Only allow family fields
  // Reject caregiver fields with 400 error
} else if (session.user.role === "CAREGIVER") {
  // Only allow caregiver fields
  // Reject family fields with 400 error
}
```

---

### Issue 3: No Validation of Values
**Severity:** Low  
**Location:** PUT handler  

**Problems:**
- No validation of email format
- No validation of phone format (should be PT format)
- No validation of hourlyRateEur (negative values allowed?)
- No validation of experienceYears (negative values?)
- No validation of age (elderAge could be -1)

**Impact:** Corrupted data in database

**Solution:** Add validation before update

---

### Issue 4: Partial Profile Returns
**Severity:** Low  
**Location:** GET response (lines 122-138)  

**Problem:**
- Separates response into "user" and "profile" objects
- But both contain overlapping data (name, email, phone, profileImage, nif, documentType, documentNumber)
- Confusing for frontend (which copy to use?)

**Impact:**
- Frontend must handle two sources of truth
- Easy to use stale data from wrong source

**Solution:** Return single merged object or clearer separation

---

### Issue 5: City/Country Duplication
**Severity:** Low  
**Location:** Lines 208-209, 276-283  

**Problem:**
- Both ProfileFamily AND ProfileCaregiver have city/country fields
- Frontend must know which role to update
- Endpoint updates both (dangerous!)

**Impact:**
- Can create inconsistency (different city for family vs caregiver)
- No clear ownership of location data

**Solution:**
- Decide which table owns city/country
- Remove from other table
- Or make them role-specific in endpoint

---

## ✅ **What's Working Well**

1. **Partial Updates:** `if (body.field !== undefined)` pattern is good
2. **JSON Handling:** Services properly JSON.stringify'd
3. **Monetary Values:** hourlyRateEur correctly converted to cents
4. **Row Auto-creation:** INSERT OR IGNORE ensures foreign key integrity
5. **Session Auth:** Properly authenticated before any operation
6. **Error Handling:** Try/catch with logging

---

## 🔧 **Recommendations for Refactor**

### Before Refactoring Profile Components:

1. **Add Role-Specific Validation**
   - Validate that FAMILY users only update family fields
   - Validate that CAREGIVER users only update caregiver fields
   - Return 400 Bad Request for invalid fields

2. **Fix Languages Field**
   - Ensure consistent JSON stringification
   - Add to profile-constants.ts with proper typing

3. **Add Field Validation**
   - Email format validation
   - Phone format validation (PT-specific)
   - Age validation (18+)
   - Rate validation (positive)
   - Experience validation (0-80)

4. **Create Response DTOs**
   - `CaregiverProfileResponse` - only caregiver fields
   - `FamilyProfileResponse` - only family fields
   - Avoid confusion from mixed data

5. **Document Field Ownership**
   - Which table owns each field?
   - What's the source of truth?
   - Create clean separation

---

## 📊 **Current Data Flow Diagram**

```
Frontend (profile/page.tsx)
    ↓
GET /api/user/profile
    ↓
Route Handler:
    SELECT u.*, pf.*, pc.* FROM User LEFT JOIN ProfileFamily LEFT JOIN ProfileCaregiver
    ↓
    Merge all fields into single "profile" object
    ↓
Response: { user: {}, profile: {} }
    ↓
Frontend: useState(profile)
    ↓
User edits form
    ↓
PUT /api/user/profile { ...fields }
    ↓
Route Handler:
    UPDATE User SET ...
    UPDATE ProfileFamily SET ... (if family fields provided)
    UPDATE ProfileCaregiver SET ... (if caregiver fields provided)
    ↓
Response: { success: true, message: "Profile updated" }
    ↓
Frontend: Refetch profile or update state
```

---

## 🎯 **Next Steps**

### Safe to Proceed With:
- ✅ Component refactoring (doesn't require API changes)
- ✅ Design token application (frontend only)
- ✅ Splitting page.tsx into role-specific components

### Should Fix First (Before Full Refactor):
- ⚠️ Add role-specific validation to API
- ⚠️ Fix languages field stringification
- ⚠️ Create separate response types

### Nice to Have (Can do later):
- 📋 Add field validation
- 📋 Improve error messages
- 📋 Reduce redundant data in responses

---

**Task 0.3 Status:** ✅ COMPLETE  
**Findings:** 5 issues identified, 1 critical, 3 medium, 1 low  
**Recommendation:** Fix validation before component refactor to avoid data corruption  
**Time to Fix:** ~4-6 hours if done now, ~20+ hours if discovered during testing

