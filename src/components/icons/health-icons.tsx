/**
 * IdosoLink Health Icons
 * Custom SVG icons with rounded, line style
 * Human, warm aesthetic - NOT fintech/crypto
 */

import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
}

// Base icon styles
const iconBase = "stroke-current stroke-[1.75] fill-none";

// =============================================================================
// CARE - Heart with hands (warmth, compassion)
// =============================================================================
export function IconHealthCare({ className }: IconProps) {
  return (
    <svg
      className={cn(iconBase, className)}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

// =============================================================================
// FAMILY - Group of people (family unit)
// =============================================================================
export function IconHealthFamily({ className }: IconProps) {
  return (
    <svg
      className={cn(iconBase, className)}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="7" r="3" />
      <circle cx="15" cy="7" r="2.5" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M21 21v-2a3 3 0 0 0-2-2.8" />
    </svg>
  );
}

// =============================================================================
// CAREGIVER - Person with caring hands
// =============================================================================
export function IconHealthCaregiver({ className }: IconProps) {
  return (
    <svg
      className={cn(iconBase, className)}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="7" r="4" />
      <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2" />
      <path d="M8 14c0 0 2 1.5 4 1.5s4-1.5 4-1.5" />
    </svg>
  );
}

// =============================================================================
// CONTRACT - Document with checkmark (agreement)
// =============================================================================
export function IconHealthContract({ className }: IconProps) {
  return (
    <svg
      className={cn(iconBase, className)}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15l2 2 4-4" />
    </svg>
  );
}

// =============================================================================
// WALLET - Simple wallet (not crypto style)
// =============================================================================
export function IconHealthWallet({ className }: IconProps) {
  return (
    <svg
      className={cn(iconBase, className)}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <path d="M16 12h.01" />
      <path d="M2 10h16" />
    </svg>
  );
}

// =============================================================================
// TOKEN - Coin with heart (utility token, not crypto)
// =============================================================================
export function IconHealthToken({ className }: IconProps) {
  return (
    <svg
      className={cn(iconBase, className)}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
      <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
    </svg>
  );
}

// =============================================================================
// REPUTATION - Star with smile (reviews)
// =============================================================================
export function IconHealthReputation({ className }: IconProps) {
  return (
    <svg
      className={cn(iconBase, className)}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

// =============================================================================
// SCHEDULE - Calendar with heart (care schedule)
// =============================================================================
export function IconHealthSchedule({ className }: IconProps) {
  return (
    <svg
      className={cn(iconBase, className)}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
    </svg>
  );
}

// =============================================================================
// PAYMENT - Card with hand (secure payment)
// =============================================================================
export function IconHealthPayment({ className }: IconProps) {
  return (
    <svg
      className={cn(iconBase, className)}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
      <path d="M6 16h4" />
    </svg>
  );
}

// =============================================================================
// BURN - Leaf disappearing (deflation, eco-friendly)
// =============================================================================
export function IconHealthBurn({ className }: IconProps) {
  return (
    <svg
      className={cn(iconBase, className)}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21c-4-2-6-5.5-6-9a6 6 0 0 1 12 0c0 3.5-2 7-6 9z" />
      <path d="M12 13c-1.5-1-2-2.5-2-4a2 2 0 0 1 4 0c0 1.5-.5 3-2 4z" />
    </svg>
  );
}

// =============================================================================
// SUPPORT - Hand with heart (help, assistance)
// =============================================================================
export function IconHealthSupport({ className }: IconProps) {
  return (
    <svg
      className={cn(iconBase, className)}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  );
}

// =============================================================================
// ELDER - Senior person (care recipient)
// =============================================================================
export function IconHealthElder({ className }: IconProps) {
  return (
    <svg
      className={cn(iconBase, className)}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="6" r="3" />
      <path d="M7 21v-2a5 5 0 0 1 10 0v2" />
      <path d="M9 17l-2 4" />
      <path d="M15 17l2 4" />
    </svg>
  );
}

// =============================================================================
// HOME CARE - House with heart
// =============================================================================
export function IconHealthHomeCare({ className }: IconProps) {
  return (
    <svg
      className={cn(iconBase, className)}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
      <path d="M12 7l.01 0" />
    </svg>
  );
}

// =============================================================================
// MEDICATION - Pill/Medicine
// =============================================================================
export function IconHealthMedication({ className }: IconProps) {
  return (
    <svg
      className={cn(iconBase, className)}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.5 20.5L3.5 13.5a4.95 4.95 0 1 1 7-7l7 7a4.95 4.95 0 0 1-7 7z" />
      <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
    </svg>
  );
}

// =============================================================================
// WELLNESS - Sun/Wellness symbol
// =============================================================================
export function IconHealthWellness({ className }: IconProps) {
  return (
    <svg
      className={cn(iconBase, className)}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M6.34 17.66l-1.41 1.41" />
      <path d="M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

// =============================================================================
// TRUST - Shield with heart
// =============================================================================
export function IconHealthTrust({ className }: IconProps) {
  return (
    <svg
      className={cn(iconBase, className)}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8v4" />
      <path d="M10 10h4" />
    </svg>
  );
}

// Export all icons
export const healthIcons = {
  care: IconHealthCare,
  family: IconHealthFamily,
  caregiver: IconHealthCaregiver,
  contract: IconHealthContract,
  wallet: IconHealthWallet,
  token: IconHealthToken,
  reputation: IconHealthReputation,
  schedule: IconHealthSchedule,
  payment: IconHealthPayment,
  burn: IconHealthBurn,
  support: IconHealthSupport,
  elder: IconHealthElder,
  homeCare: IconHealthHomeCare,
  medication: IconHealthMedication,
  wellness: IconHealthWellness,
  trust: IconHealthTrust,
};
