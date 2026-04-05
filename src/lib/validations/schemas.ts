import { z } from "zod";

// Reusable strong password validator
const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one digit");

// POST /api/register
export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  password: strongPassword,
  role: z.enum(["FAMILY", "CAREGIVER"]),
  acceptTerms: z.boolean().optional(),
});

// POST /api/auth/forgot-password
export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// POST /api/auth/reset-password
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
  password: strongPassword,
});

// POST /api/contracts
export const createContractSchema = z.object({
  caregiverUserId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  hourlyRateEur: z.number().int().min(0),
  totalHours: z.number().int().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  serviceTypes: z.string().optional(),
  hoursPerWeek: z.number().int().min(0).optional(),
});

// POST /api/reviews
export const createReviewSchema = z.object({
  contractId: z.string().min(1),
  toUserId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  punctualityRating: z.number().int().min(1).max(5).optional(),
  professionalismRating: z.number().int().min(1).max(5).optional(),
  communicationRating: z.number().int().min(1).max(5).optional(),
  qualityRating: z.number().int().min(1).max(5).optional(),
});

// POST /api/payments/contract-fee
export const contractFeeSchema = z.object({
  contractId: z.string().min(1),
});

// PATCH /api/admin/settings
export const adminSettingsSchema = z.object({
  activationCostEurCents: z.number().int().min(0).optional(),
  contractFeeEurCents: z.number().int().min(0).optional(),
  platformFeePercent: z.number().int().min(0).max(100).optional(),
});

// POST /api/chat/messages
export const chatMessageSchema = z.object({
  chatRoomId: z.string().min(1),
  content: z.string().min(1).max(5000),
  messageType: z.enum(["text", "image", "file"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// POST /api/contact
export const contactFormSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(5000),
});
