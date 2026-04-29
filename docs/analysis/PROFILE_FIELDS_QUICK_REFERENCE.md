# Profile Fields Quick Reference
## Cuidador vs Familiar - Field Mapping

---

## Tab Structure Comparison

### Caregiver Profile (5 Tabs)
```
┌─────────────────────────────────────────────────┐
│ [INFO] [DOCS] [SERVIÇOS] [CONTACTO] [CONFIG]   │
└─────────────────────────────────────────────────┘
```

### Family Profile (4 Tabs)
```
┌──────────────────────────────────────────┐
│ [INFO] [DOCS] [FAMILIAR] [CONTACTO] [CONFIG] │
└──────────────────────────────────────────┘
```

---

## INFO Tab - Personal Information

### Caregiver - INFO Tab

| Field | Type | Required | Current Status | Notes |
|-------|------|----------|-----------------|-------|
| Nome | Text | ✓ | ✓ Exists | Full name |
| Cidade | Text | ✓ | ✓ Exists | City/Location |
| **Título Profissional** | Text | ✓ | **❌ Missing** | e.g., "Enfermeira Especializada" |
| **Anos de Experiência** | Number | ✓ | **❌ Missing** | Years in profession |
| **Bio Profissional** | Textarea | | **❌ Missing** | Professional description |
| **Idiomas** | Checkboxes | | **❌ Missing** | Languages: Portuguese, English, Spanish, etc. |

### Family - INFO Tab

| Field | Type | Required | Current Status | Notes |
|-------|------|----------|-----------------|-------|
| Nome | Text | ✓ | ✓ Exists | Full name |
| Cidade | Text | ✓ | ✓ Exists | City/Location |
| NIF | Text | ✓ | ✓ Exists | Tax ID |
| (No professional fields) | | | | Not applicable |

---

## DOCS Tab - Documentation

### Caregiver - DOCS Tab

| Field | Type | Required | Current Status | Notes |
|-------|------|----------|-----------------|-------|
| NIF | Text | ✓ | ✓ Exists | Tax ID |
| Document Type | Select | ✓ | ✓ Exists | CC / Passport / Residence |
| Document Number | Text | ✓ | ✓ Exists | Document ID |
| **Background Check** | Upload | ✓ | **❌ Missing** | Criminal record verification |
| **Status** | Select | ✓ | **❌ Missing** | PENDING / VERIFIED / FAILED |
| **Certifications** | Upload | | **❌ Missing** | Professional certifications |

### Family - DOCS Tab

| Field | Type | Required | Current Status | Notes |
|-------|------|----------|-----------------|-------|
| NIF | Text | ✓ | ✓ Exists | Tax ID |
| Document Type | Select | ✓ | ✓ Exists | CC / Passport / Residence |
| Document Number | Text | ✓ | ✓ Exists | Document ID |

---

## Special Tabs - Role-Specific Content

### Caregiver - SERVIÇOS Tab (Services)

| Field | Type | Required | Current Status | Notes |
|-------|------|----------|-----------------|-------|
| **Service Types** | Checkboxes | ✓ | **Partial** | 12 service types (see below) |
| **Hourly Rate** | Number | ✓ | ✓ Exists | €/hour |
| **Specific Conditions** | Checkboxes | | **❌ Missing** | Alzheimer, Parkinson, Cancer, etc. |
| **Availability** | Grid | | **❌ Missing** | 7-day weekly schedule |
| **Response Time** | Select | | **❌ Missing** | Expected response time (minutes) |

#### 12 Service Types
- [ ] Cuidados Pessoais (Personal Care)
- [ ] Medicação (Medication)
- [ ] Mobilidade (Mobility)
- [ ] Companhia (Companionship)
- [ ] Refeições (Meal Preparation)
- [ ] Tarefas Domésticas (Light Housework)
- [ ] Transporte (Transportation)
- [ ] Estimulação Cognitiva (Cognitive Support)
- [ ] Cuidados Noturnos (Night Care)
- [ ] Cuidados Paliativos (Palliative Care)
- [ ] Fisioterapia (Physiotherapy)
- [ ] Enfermagem (Nursing Care)

#### 8 Specific Conditions
- [ ] Cancro (Cancer)
- [ ] Artrite (Arthritis)
- [ ] AVC (Stroke)
- [ ] Diabetes (Diabetes)
- [ ] Demência (Dementia)
- [ ] Alzheimer (Alzheimer's)
- [ ] Parkinson (Parkinson's)
- [ ] Insuficiência Cardíaca (Heart Disease)

### Family - FAMILIAR Tab (was "Idoso")

| Field | Type | Required | Current Status | Notes |
|-------|------|----------|-----------------|-------|
| **Nome do Familiar** | Text | ✓ | **❌ Missing** | Dependent/Elder name |
| **Idade** | Number | ✓ | **❌ Missing** | Dependent age |
| **Relação** | Select | | **❌ Missing** | Spouse/Parent/Child/Sibling/Grandparent |
| **Necessidades** | Textarea | | ✓ Exists (as elderNeeds) | Specific care needs |

#### Family - Health Profile (Sub-section)

| Field | Type | Required | Current Status | Notes |
|-------|------|----------|-----------------|-------|
| **Nível de Mobilidade** | Select | | **❌ Missing** | Boa/Parcial/Total |
| **Condições Médicas** | Checkboxes | | **❌ Missing** | Same 8 conditions as caregiver |
| **Medicações** | Textarea | | **❌ Missing** | Current medications |
| **Restrições Alimentares** | Checkboxes | | **❌ Missing** | Dietary restrictions |
| **Serviços Necessários** | Checkboxes | | **❌ Missing** | Same 12 service types as caregiver |

---

## CONTACTO Tab - Contact Information

### Both Roles

| Field | Type | Required | Current Status | Notes |
|-------|------|----------|-----------------|-------|
| Email | Text | ✓ | ✓ Exists | Read-only |
| Phone | Text | ✓ | ✓ Exists | Format: +351 XXX XXX XXX |
| **Emergency Contact Name** | Text | ✓ | ✓ Exists (called emergencyContactName) | |
| **Emergency Contact Phone** | Text | ✓ | ✓ Exists | |
| **Emergency Contact Relationship** | Select | | **❌ Missing** | Spouse/Child/Friend/Other |

### Caregiver Additional

| Field | Type | Required | Current Status | Notes |
|-------|------|----------|-----------------|-------|
| **Professional Hours** | Time Range | | **❌ Missing** | When available for inquiries |
| **Preferred Contact Method** | Select | | **❌ Missing** | Phone/Email/WhatsApp/Other |

---

## CONFIG Tab - Settings (Both Roles)

| Field | Type | Required | Current Status | Notes |
|-------|------|----------|-----------------|-------|
| Push Notifications | Toggle | | ✓ Exists | Browser notifications |
| Language | Select | | ✓ Exists | Português / English |
| Email Notifications | Select | | ✓ Exists | All / Important / None |
| Theme | Toggle | | ✓ Exists | Light / Dark |
| Delete Account | Button | | ✓ Exists | Irreversible action |
| Logout | Button | | ✓ Exists | Sign out |

---

## Metrics Cards

### Caregiver Metrics (Showing)
```
┌──────────┬─────────────┬────────┬──────────┐
│Contratos │ Avaliações  │ Nota   │ €/hora   │
│    12    │     27      │  4.9   │  €18.50  │
└──────────┴─────────────┴────────┴──────────┘
```

### Family Metrics (**MISSING** - Should Add)
```
┌────────────────┬─────────────────┬──────────┬────────────┐
│ Demandas       │ Membros Família │Investido │Taxa Sucesso│
│ Ativas         │                 │          │            │
│      3         │        2        │  €450    │    75%     │
└────────────────┴─────────────────┴──────────┴────────────┘
```

---

## Summary of Missing Fields

### ❌ Caregiver - Missing Fields (8 total)
1. Título Profissional (Professional Title)
2. Anos de Experiência (Years of Experience)
3. Bio Profissional (Professional Bio)
4. Idiomas (Languages)
5. Background Check (Upload)
6. Background Check Status (Verification)
7. Professional Certifications
8. Specific Conditions Expertise
9. Weekly Availability Calendar
10. Response Time Preference
11. Professional Contact Hours
12. Preferred Contact Method

**Total Impact:** 12 missing fields affecting professional credibility

### ❌ Family - Missing Fields (10+ total)
1. Dependent Name (called "elderName" - confusing naming)
2. Dependent Age (called "elderAge" - confusing naming)
3. Dependent Relationship Type
4. Dependent Mobility Level
5. Dependent Medical Conditions
6. Dependent Medications
7. Dependent Dietary Restrictions
8. Services Needed (for dependent)
9. Emergency Contact Relationship
10. Family Metrics Block (No metrics displayed!)
11. Preferred Service Frequency
12. Budget Range

**Total Impact:** 12+ missing fields affecting health profile completeness

---

## Quick Migration Checklist

### Remove/Rename
- [ ] Rename "elderName" → "dependentName"
- [ ] Rename "elderAge" → "dependentAge"
- [ ] Rename "Idoso" tab → "Familiar"
- [ ] Remove unused "Idoso" terminology

### Add for Caregiver
- [ ] Add title field (required)
- [ ] Add experienceYears field (required)
- [ ] Add bio textarea
- [ ] Add languages checkboxes
- [ ] Add background check upload
- [ ] Add certifications upload
- [ ] Add specific conditions expertise
- [ ] Add availability calendar
- [ ] Add response time select

### Add for Family
- [ ] Add dependent relationship type
- [ ] Add dependent health profile section
- [ ] Add medical conditions checkboxes
- [ ] Add mobility level select
- [ ] Add dietary restrictions
- [ ] Add medications textarea
- [ ] Add emergency contact relationship
- [ ] Add family metrics block
- [ ] Add service frequency preference
- [ ] Add budget range inputs

### Update Components
- [ ] Split page.tsx into role-specific components
- [ ] Create ProfileHeader component
- [ ] Create MetricsBlock component
- [ ] Create role-specific form components
- [ ] Update TypeScript interfaces
- [ ] Update API endpoints
- [ ] Update validation rules

---

## Database Schema Changes

### Current caregivers table
```sql
-- Existing fields ✓
- id, name, email, phone, nif, city, profileImage

-- Caregiver-specific existing ✓
- title, bio, experienceYears
- services (JSON), hourlyRateEur
- certifications, languages
- averageRating, totalReviews, totalContracts
- backgroundCheckStatus, backgroundCheckUrl

-- Missing ✓
- specificConditionsExperience (JSON)
- availability (JSON)
- responseTimeMinutes
- professionalContactHours (JSON)
- preferredContactMethod
```

### Current families table (or users table with FAMILY role)
```sql
-- Existing fields ✓
- id, name, email, phone, nif, city, profileImage

-- Family-specific existing ✓
- elderName, elderAge, elderNeeds

-- Missing ✓
- dependents (JSON) - Support multiple
- primaryDependentNeeds (JSON with health info)
- emergencyContactRelationship
- preferredBudgetRange (JSON)
- serviceFrequency
- activeDemands (count)
- successRate (calculated)
```

---

## Language & Terminology Standards

| Term | Current | Standard | Status |
|------|---------|----------|--------|
| Elderly | "Idoso" | "Familiar" | **CHANGE** |
| Services | "Serviços" | "Serviços" | ✓ OK |
| Contact | "Contacto" | "Contacto" | ✓ OK (PT-PT) |
| Settings | "Config" | "Config" | ✓ OK |
| Documents | "Docs" | "Docs" | ✓ OK |
| Professional Title | "Título Profissional" | "Título Profissional" | ✓ OK |
| Experience | "Anos de Experiência" | "Anos de Experiência" | ✓ OK |
| Rate | "/hora" | "€{rate}/hora" | **IMPROVE** |
| Verified | "Verificado" | "Verificado" | ✓ OK |

---

## File Size Estimate After Split

| File | Current | Target | Change |
|------|---------|--------|--------|
| `profile/page.tsx` | 1544 lines | 150 lines (router only) | **90% reduction** |
| New component files | — | ~4000 lines total | New |
| Type definitions | — | ~500 lines | New |

**Benefit:** Improved maintainability, easier testing, clearer separation of concerns

---

## Implementation Priority Order

1. **Phase 1 (Week 1-2):** Update data models & API endpoints
2. **Phase 2 (Week 3-4):** Build caregiver profile component
3. **Phase 3 (Week 4-5):** Build family profile component
4. **Phase 4 (Week 5-6):** Testing, refinement, rollout

---

**Quick Reference Version:** 1.0  
**Generated:** April 29, 2026  
**For:** Development Team Sprint Planning
