# Profile Pages Analysis & Recommendations
## UI-Kit Standardization for Cuidador vs Familiar Role Differentiation

**Document Date:** 2026-04-29  
**Status:** Audit Complete - Ready for Implementation  
**Priority:** High (Architecture - Foundation for Role-Specific UX)

---

## Executive Summary

The current profile page implementation at `/src/app/app/profile/page.tsx` attempts role-specific differentiation through conditional rendering (`isFamily` / `isCaregiver`), but falls short of the comprehensive role-specific design demonstrated in the bloom-elements UI-kit. The fundamental issue is that Cuidador (Caregiver) and Familiar (Family/Client) users have **fundamentally different contexts, metrics, and information needs**, yet the current implementation treats them as variants of the same form.

### Key Finding
The bloom-elements UI-kit demonstrates proper role differentiation with distinct:
- **Metrics displays** (Caregiver: Contracts, Reviews, Rating, Hourly Rate vs Family: Dependent members, Active demands)
- **Tab structures** (Caregiver: Info, Docs, **Services**, Contact, Config vs Family: Info, Docs, **Elder**, Contact, Config)
- **Form fields** (Caregiver: Professional title, experience years, rates vs Family: Elder name, age, specific health needs)
- **Dashboard context** (Payment provider vs payment recipient)

---

## Current Implementation Status

### File: `/src/app/app/profile/page.tsx` (1544 lines)

#### What's Currently Role-Specific (✅ Good)
1. **Header subtitle** (line 600-602)
   - Caregiver: "Gira as suas informações profissionais e preferências"
   - Family: "Gerencie as informações do seu familiar"

2. **Metrics cards** (line 737-779)
   - Only shown for Caregiver: Contracts, Reviews, Rating, Hourly Rate
   - Family has no equivalent metrics block

3. **Tab structure** (line 784)
   - Caregiver: 5 tabs (Info, Docs, Services, Contact, Config)
   - Family: 4 tabs (Info, Docs, Elder, Contact, Config)

4. **Role-specific tabs**
   - Caregiver: "Serviços" tab (line 798-804)
   - Family: "Idoso" tab (line 806-813)

#### What's Currently NOT Role-Specific (⚠️ Problem Areas)
1. **Personal Information section** (line 829-900+)
   - Same fields for both roles: Name, City, NIF, Email, Phone
   - **Missing for Caregiver**: Professional title, Years of experience, Bio, Specializations
   - **Missing for Family**: Nothing specific shown

2. **Documents tab** (line 900+)
   - Same document types for both (CC, Passport, Residence Permit)
   - Missing role-specific documentation requirements

3. **Contact tab** (line 1276+)
   - Same emergency contact fields for both
   - **Caregiver should have**: Professional availability, working hours, response time preferences
   - **Family should have**: Emergency contact info (more critical)

4. **Settings tab** (line 1326+)
   - Appears to be generic for both roles
   - Should have different notification and preference defaults

5. **Visual hierarchy**
   - No distinct card layout or hero section for Caregiver professional profile
   - Family profile lacks visual distinction for dependent/elder focus

---

## Bloom-Elements UI-Kit Architecture

### ProfileView.tsx Pattern
The bloom-elements `ProfileView` demonstrates the complete pattern:

```
Caregiver Profile Structure:
├── Header Section
│   ├── Avatar (with upload)
│   ├── Name + Title (Professional)
│   └── Location + Verification Badge
├── Metrics Block (unique to Caregiver)
│   ├── Contracts | Reviews | Rating | /hora
│   └── Stats displayed as cards with icons
├── Tabs (5 tabs)
│   ├── Info
│   │   ├── Personal: Name, City, Title, Experience Years
│   │   ├── Bio section
│   │   └── Languages
│   ├── Docs (verification documents)
│   ├── Services (Service type selection)
│   ├── Contact (Professional contact + Emergency)
│   └── Config (Notifications, Preferences)
└── Footer Actions (Delete account, Logout)

Family Profile Structure:
├── Header Section
│   ├── Avatar (with upload)
│   ├── Name + Role
│   └── Location
├── (No metrics block - different context)
├── Tabs (4 tabs - different structure)
│   ├── Info
│   │   ├── Personal: Name, City
│   │   └── (No professional fields)
│   ├── Docs
│   ├── Elder (Familiar)
│   │   ├── Elder name
│   │   ├── Elder age
│   │   └── Specific health needs
│   ├── Contact (Personal emergency contact)
│   └── Config (Notifications, Preferences)
└── Footer Actions
```

### Design Tokens (bloom-elements.css)
```
Colors:
- Primary: HSL(221, 83%, 53%) - Brand blue
- Success: HSL(160, 84%, 39%) - Green (verified)
- Warning: HSL(38, 92%, 50%) - Orange (pending)
- Destructive: HSL(0, 84%, 60%) - Red

Typography:
- Display: Space Grotesk (bold, tracking-tight)
- Body: Inter (medium, regular)
- Sizing: Scale from text-xs (10px) to text-3xl

Radius:
- Cards: rounded-2xl (1rem)
- Buttons: rounded-xl (0.75rem)

Shadows:
- shadow-card: 0 4px 12px rgba(0,0,0,0.08)
- shadow-elevated: 0 8px 24px rgba(0,0,0,0.12)
```

---

## Detailed Comparison & Recommendations

### 1. METRICS DISPLAY ⭐ High Priority

#### Current State
```tsx
// Lines 737-779: Only shows for Caregiver
{isCaregiver && (
  <div className={cn(tokens.layout.grid.responsive4)}>
    // Contracts, Reviews, Rating, /hora
  </div>
)}
```

#### Bloom-Elements Pattern
**Caregiver metrics** (from DashboardView & ProfileView)
```
┌─────────┬──────────┬────────┬──────────┐
│Contratos│Avaliações│  Nota  │/hora     │
│   12    │   27     │  4.9   │€18.50    │
└─────────┴──────────┴────────┴──────────┘
```

**Family metrics** (context-specific)
```
Should show:
- Active Demands (numero de demandas ativas)
- Members/Dependents (numero de familiares)
- Total Spent/Budget (investimento)
- Success Rate (taxa de sucesso em contratos)
```

#### Recommendation
```
✓ Add Family metrics block with role-appropriate stats
✓ Add metrics to dashboard-level analytics
✓ Use consistent StatBlock component from bloom-elements
✓ Display metrics prominently on profile header
✓ Include verification badge with metrics

Code Structure:
if (isCaregiver) {
  // Contratos, Avaliações, Nota, /hora
} else if (isFamily) {
  // Demandas Ativas, Membros, Investimento, Taxa Sucesso
}
```

---

### 2. TAB STRUCTURE & CONTENT ⭐ High Priority

#### Current State
```tsx
// Caregiver: 5 tabs
<TabsList grid-cols-5>
  Info | Docs | Serviços | Contacto | Config

// Family: 4 tabs
<TabsList grid-cols-4>
  Info | Docs | Idoso | Contacto | Config
```

#### Issues Identified
1. **Tab naming inconsistency**: Should be consistent with bloom-elements ("INFO", "DOCS", "SERVIÇOS", "CONTACTO", "CONFIG")
2. **Missing tab content**:
   - "Serviços" tab exists but content not fully fleshed out
   - "Idoso" tab has basic fields but missing context

#### Bloom-Elements Pattern
**Caregiver Tab Contents:**
```
INFO Tab:
├── Informações Pessoais
│   ├── Nome (Name)
│   ├── Cidade (City)
│   ├── Título Profissional (Professional Title) ← IMPORTANT
│   ├── Anos de Experiência (Experience Years) ← IMPORTANT
│   ├── Bio (Biography/Description)
│   └── Idiomas (Languages)
└── Verificação Profissional (Professional Verification status)

DOCS Tab:
├── NIF (Número de Identificação Fiscal)
├── Criminal Record Check
├── Professional Certifications
└── Document Upload Areas

SERVIÇOS Tab:
├── Specializations (Checkbox list of 12 service types)
├── Experience with specific conditions (Alzheimer, Parkinson, etc.)
├── Languages spoken
└── Availability (7-day grid)

CONTACTO Tab:
├── Email (Read-only)
├── Phone
├── Professional Contact Hours
├── Response Time Preference
└── Emergency Contact (Name, Phone)

CONFIG Tab:
├── Push Notifications (Toggle + Permission Request)
├── Language (Select)
├── Email Notifications (Select)
└── Delete Account / Logout
```

**Family Tab Contents:**
```
INFO Tab:
├── Informações Pessoais
│   ├── Nome (Name)
│   ├── Cidade (City)
│   └── (No professional fields)
└── Identificação
    ├── NIF
    └── Document Type

DOCS Tab:
├── Identification Documents
├── Household Documents
└── Upload Areas

FAMILIAR Tab: (Renamed from "Idoso")
├── Informações do Familiar
│   ├── Nome do Familiar (Elder/Dependent Name) ← PRIMARY
│   ├── Idade (Age)
│   ├── Relação (Relationship - care type)
│   └── Necessidades Específicas (Specific Needs - textarea)
└── Saúde (Health Section)
    ├── Condições Médicas (Medical Conditions - checkboxes)
    ├── Restrições Alimentares (Dietary Restrictions)
    ├── Mobilidade (Mobility Level - select)
    └── Medicações (Medications - textarea)

CONTACTO Tab:
├── Email (Read-only)
├── Phone
├── Emergency Contact (Name, Phone) ← MORE PROMINENT
└── Alternative Contact (Optional)

CONFIG Tab:
├── Push Notifications
├── Language
├── Email Preferences
└── Delete Account / Logout
```

#### Recommendation
```tsx
// Implement consistent tab structure
const CAREGIVER_TABS = [
  { value: "info", label: "INFO" },
  { value: "docs", label: "DOCS" },
  { value: "services", label: "SERVIÇOS" },
  { value: "contact", label: "CONTACTO" },
  { value: "config", label: "CONFIG" }
];

const FAMILY_TABS = [
  { value: "info", label: "INFO" },
  { value: "docs", label: "DOCS" },
  { value: "elder", label: "FAMILIAR" }, // Rename from "Idoso"
  { value: "contact", label: "CONTACTO" },
  { value: "config", label: "CONFIG" }
];

// Use conditional tab rendering
tabs={isCaregiver ? CAREGIVER_TABS : FAMILY_TABS}

// Populate each tab with role-specific content
```

---

### 3. FORM FIELDS & DATA MODEL ⭐ High Priority

#### Current ProfileData Interface
```tsx
interface ProfileData {
  // Common
  name: string;
  email: string;
  phone: string;
  nif?: string;
  documentType?: string;
  documentNumber?: string;
  profileImage?: string;
  city?: string;

  // Caregiver-specific
  title?: string;                    // Professional title
  bio?: string;                      // Professional bio
  experienceYears?: number;          // Years of experience
  services?: string[];               // Service types
  hourlyRateEur?: number;            // Hourly rate
  certifications?: string;           // Professional certifications
  languages?: string;                // Languages spoken
  averageRating?: number;            // Rating (0-5)
  totalReviews?: number;             // Review count
  totalContracts?: number;           // Contract count

  // Family-specific (Poorly Named!)
  elderName?: string;                // Should be: dependentName
  elderAge?: number;                 // Should be: dependentAge
  elderNeeds?: string;               // Should be: dependentNeeds
  
  // Emergency Contact (both, but context different)
  emergencyContactName?: string;
  emergencyContactPhone?: string;

  // Missing for both
  backgroundCheckStatus?: string;    // Should be caregiver-specific
  backgroundCheckUrl?: string;       // Should be caregiver-specific
}
```

#### Issues Identified
1. **Field naming**: "elder" prefix misleading - could be step-parent, sibling, parent
2. **Missing Caregiver fields**:
   - Professional availability (working hours)
   - Specific conditions experience (Alzheimer, Parkinson, etc.)
   - Response time preference
   - Professional certifications list (not just textarea)
   - Verification status
   - Background check details
   
3. **Missing Family fields**:
   - Relationship type (Spouse, Child, Sibling, Grandson, etc.)
   - Multiple dependents support
   - Health conditions of dependent
   - Dietary restrictions
   - Mobility level
   - Medication list
   - Budget/rate preferences

#### Recommendation
```tsx
// Split into two separate, role-specific interfaces

interface CaregiverProfileData {
  // Personal
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  
  // Professional Identity
  title: string;                              // e.g., "Enfermeira Especializada"
  bio: string;                                // Professional description
  city: string;
  
  // Qualifications
  experienceYears: number;
  languages: string[];                        // ["Portuguese", "English", "Spanish"]
  certifications: string[];                   // Professional certs
  specializations: string[];                  // From 12 service types
  
  // Specialization Details
  specificConditionsExperience: {             // e.g., Alzheimer, Parkinson
    condition: string;
    yearsExperience: number;
  }[];
  
  // Pricing & Availability
  hourlyRateEur: number;
  availability: {                             // 7-day grid
    dayOfWeek: number;                        // 0-6
    available: boolean;
    hoursStart?: string;
    hoursEnd?: string;
  }[];
  responseTimeMinutes: number;                // Expected response time
  
  // Professional Verification
  nif: string;
  backgroundCheckStatus: "VERIFIED" | "PENDING" | "FAILED";
  backgroundCheckUrl?: string;
  backgroundCheckDate?: string;
  verificationBadge: boolean;
  
  // Identification Documents
  documentType: "CC" | "PASSPORT" | "RESIDENCE";
  documentNumber: string;
  
  // Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
}

interface FamilyProfileData {
  // Personal
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  
  // Family Identity
  city: string;
  
  // Dependent Information (Support for multiple dependents)
  dependents: {
    id: string;
    name: string;
    age: number;
    relationship: "spouse" | "parent" | "child" | "sibling" | "grandparent" | "other";
    isPrimary: boolean;
  }[];
  
  // Primary Dependent Health Profile
  primaryDependentNeeds: {
    mobilityLevel: "total" | "parcial" | "boa";
    medicalConditions: string[];              // From condition list
    medicalConditionsNotes: string;
    dietaryRestrictions: string[];
    servicesNeeded: string[];                 // From 12 service types
    medicationList: string;
    additionalNotes: string;
  };
  
  // Identification
  nif: string;
  documentType: "CC" | "PASSPORT" | "RESIDENCE";
  documentNumber: string;
  
  // Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  
  // Preferences
  preferredBudgetRange: {
    min: number;
    max: number;
  };
  serviceFrequency: "daily" | "weekly" | "monthly" | "as_needed";
}
```

---

### 4. VISUAL DESIGN & HIERARCHY ⭐ Medium Priority

#### Current Implementation Issues
1. **No hero/cover section**: Bloom-elements shows cover gradient
2. **Avatar styling**: Should be larger (80x80 minimum)
3. **Verification badge**: Not prominently displayed
4. **Card structure**: Could use more visual hierarchy
5. **Typography**: Missing consistent use of design tokens

#### Bloom-Elements Pattern
```jsx
// Profile Header Structure
<div className="relative">
  {/* Cover/Hero Section */}
  <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl" />
  
  {/* Avatar Overlap */}
  <div className="relative -mt-16 pl-6">
    <div className="w-24 h-24 rounded-2xl bg-primary/10 border-4 border-card">
      <img src={profileImage} alt={name} />
    </div>
  </div>
  
  {/* Header Content */}
  <div className="mt-4 space-y-2">
    <div className="flex items-center gap-2">
      <h1 className="text-3xl font-display font-black">
        {name}
      </h1>
      {isVerified && (
        <Badge className="bg-success/10 text-success">
          <IconCheck className="h-3 w-3" />
          Verificado
        </Badge>
      )}
    </div>
    <p className="text-sm text-muted-foreground">
      {title} • {city}
    </p>
  </div>
</div>
```

#### Recommendation
```
✓ Add cover image/gradient section to profile header
✓ Increase avatar size and improve styling
✓ Display verification badge prominently
✓ Use consistent card styling (shadow-card)
✓ Improve typography hierarchy with design tokens
✓ Add visual separation between sections
✓ Use role-specific color accents (primary for caregiver, secondary for family)
```

---

### 5. LANGUAGE & LOCALIZATION ⭐ Medium Priority

#### Portuguese (PT-PT) Standardization Issues

| English | Current careapp | Bloom-Elements | Recommendation |
|---------|-----------------|-----------------|-----------------|
| Elderly/Elder | "Idoso" | "Familiar" | Use "Familiar" (more inclusive of all dependents) |
| Services | "Serviços" | "Serviços" | ✓ Consistent |
| Contact | "Contacto" | "Contacto" | ✓ Consistent (PT-PT spelling) |
| Settings | "Config" | "Config" | ✓ Consistent |
| Documents | "Docs" | "Docs" | ✓ Consistent |
| Professional Title | "Título Profissional" | "Título Profissional" | ✓ Consistent |
| Years of Experience | "Anos de Experiência" | "Anos de Experiência" | ✓ Consistent |
| Hourly Rate | "/hora" | "Taxa/hora" or "€/hora" | Recommend: "€{rate}/hora" |
| Contracts | "Contratos" | "Contratos" | ✓ Consistent |
| Reviews | "Avaliações" | "Avaliações" | ✓ Consistent |
| Rating | "Nota" | "Nota" | ✓ Consistent |
| Emergency Contact | "Contacto de Emergência" | "Contacto de Emergência" | ✓ Consistent |
| Verified | "Verificado" | "Verificado" | ✓ Consistent |

---

## Implementation Roadmap

### Phase 1: Foundation (1-2 sprints)
**Objective:** Update data model and type safety

- [ ] Create separate `CaregiverProfileData` & `FamilyProfileData` interfaces
- [ ] Update API endpoints to return role-specific data structures
- [ ] Add database migrations for new fields
- [ ] Update form validation rules per role

**Files to modify:**
- `src/app/app/profile/page.tsx` (refactor into separate components)
- `src/lib/api-client.ts` (update profile fetch/update logic)
- `src/components/profile/*.tsx` (create role-specific sub-components)

### Phase 2: UI Components (2-3 sprints)
**Objective:** Implement role-specific profile layouts

- [ ] Create `ProfileHeaderCaregiver` component
- [ ] Create `ProfileHeaderFamily` component
- [ ] Create `CaregiverProfileForm` component
- [ ] Create `FamilyProfileForm` component
- [ ] Add metrics cards for both roles
- [ ] Implement role-specific tab structures

**Files to create:**
- `src/components/profile/ProfileHeader.tsx`
- `src/components/profile/CaregiverForm.tsx`
- `src/components/profile/FamilyForm.tsx`
- `src/components/profile/MetricsCard.tsx`
- `src/components/profile/ServicesList.tsx`
- `src/components/profile/HealthProfile.tsx`

### Phase 3: Polish & Testing (1 sprint)
**Objective:** Align with bloom-elements design system

- [ ] Apply bloom-elements design tokens to all components
- [ ] Implement cover image/hero section
- [ ] Add verification badge styling
- [ ] Responsive testing across breakpoints
- [ ] E2E testing for form submission
- [ ] Accessibility testing (WCAG 2.1 AA)

### Phase 4: Analytics & Monitoring (1 sprint)
**Objective:** Track usage and errors

- [ ] Add usage analytics for profile views
- [ ] Monitor form submission errors
- [ ] Track profile completion rates
- [ ] Set up error logging/alerting

---

## Bloom-Elements Integration Points

### Components to Import/Adapt
```tsx
// From bloom-elements
import { StatBlock } from "@/components/evyra/EvyraShared";
import { SectionHeader } from "@/components/evyra/EvyraShared";
import { ProfileModal } from "@/components/evyra/ProfileModal";

// Design tokens
import { tokens } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

// Colors/Shadows
const COLORS = {
  caregiver: {
    primary: "hsl(221, 83%, 53%)",        // Brand blue
    accent: "hsl(160, 84%, 39%)",         // Success green
  },
  family: {
    primary: "hsl(199, 89%, 48%)",        // Info cyan
    accent: "hsl(38, 92%, 50%)",          // Warning orange
  },
};
```

### Styling Constants
```tsx
// Consistent with bloom-elements
const PROFILE_STYLES = {
  headerHeight: "h-32",
  avatarSize: "w-24 h-24",
  avatarBorder: "border-4 border-card",
  cardRadius: "rounded-2xl",
  buttonRadius: "rounded-xl",
  shadowCard: "shadow-card",
  shadowElevated: "shadow-elevated",
};
```

---

## Validation Checklist

Before marking implementation complete:

### Data Completeness
- [ ] Caregiver profile requires: name, email, phone, nif, title, experienceYears, city, hourlyRateEur
- [ ] Family profile requires: name, email, phone, nif, primaryDependentName, primaryDependentAge
- [ ] Both require: profileImage, emergencyContact

### UI Completeness
- [ ] Caregiver shows 5 tabs: Info, Docs, Services, Contact, Config
- [ ] Family shows 4 tabs: Info, Docs, Familiar, Contact, Config
- [ ] Both show appropriate metrics blocks
- [ ] Edit/Save functionality works per role

### Accessibility
- [ ] Form labels properly associated with inputs
- [ ] Tab focus management works correctly
- [ ] Color contrast meets WCAG AA
- [ ] Mobile responsive down to 320px

### Performance
- [ ] Page loads in < 2 seconds
- [ ] No unnecessary re-renders
- [ ] Images optimized (profile photos)
- [ ] Form validation is client-side + server-side

---

## Risk Mitigation

### Risks
1. **Data Migration**: Existing profiles may have missing role-specific fields
   - **Mitigation**: Provide data backfill script; default values for new fields
   
2. **API Backwards Compatibility**: Old API may return unified profile format
   - **Mitigation**: Create adapter layer in frontend; update API endpoints first
   
3. **User Confusion**: Users confused by changed tab names/structure
   - **Mitigation**: Add inline help text; release notes in notifications
   
4. **Form Validation**: New required fields may break existing workflows
   - **Mitigation**: Make new fields optional initially; encourage completion

---

## Success Metrics

- [ ] Profile completion rate > 85% (currently may be lower)
- [ ] Form submission errors < 2%
- [ ] Page load time < 2s (Core Web Vitals)
- [ ] User satisfaction score > 4/5 (in surveys)
- [ ] Support tickets related to profile < 5 per month

---

## Appendix: Side-by-Side Field Comparison

### INFO Tab Content

| Field | Caregiver | Family |
|-------|-----------|--------|
| Name | ✓ | ✓ |
| City | ✓ | ✓ |
| **Professional Title** | ✓ (Required) | ✗ |
| **Years Experience** | ✓ (Required) | ✗ |
| **Bio** | ✓ (Textarea) | ✗ |
| **Languages** | ✓ (Checkboxes) | ✗ |
| **Dependent Name** | ✗ | ✓ (Required) |
| **Dependent Age** | ✗ | ✓ (Required) |
| **Dependent Relationship** | ✗ | ✓ (Select) |

### DOCS Tab Content

| Document | Caregiver | Family |
|----------|-----------|--------|
| NIF | ✓ | ✓ |
| Passport | ✓ | ✓ |
| Residence Permit | ✓ | ✓ |
| **Background Check** | ✓ (Upload) | ✗ |
| **Professional Certs** | ✓ (Upload) | ✗ |

### SPECIAL Tabs (Role-Specific)

| Tab | Caregiver | Family | Content |
|-----|-----------|--------|---------|
| Serviços | ✓ | ✗ | Service type checkboxes, condition expertise |
| Familiar | ✗ | ✓ | Dependent health profile, medical conditions |

---

## References

**Current Implementation:**
- `/home/user/careapp/src/app/app/profile/page.tsx` (1544 lines)

**Bloom-Elements Reference:**
- `/home/user/bloom-elements/src/components/evyra/views/ProfileView.tsx` - Complete reference implementation
- `/home/user/bloom-elements/src/components/evyra/EvyraShared.tsx` - Design patterns & shared components
- `/home/user/bloom-elements/src/components/evyra/DashboardView.tsx` - Role-specific dashboard
- `/home/user/bloom-elements/bloom-elements.css` - Design tokens
- `/home/user/bloom-elements/tailwind.config.ts` - Styling system

**Related Pages to Update:**
- `/src/app/app/profile/setup` - Initial onboarding (should use same role-specific logic)
- `/src/app/app/dashboard` - May show profile summary cards
- `/src/app/search` - Shows caregiver profiles (different view, not edit)

---

**Document Prepared By:** Claude Code  
**Last Updated:** 2026-04-29  
**Next Review:** After Phase 1 implementation
