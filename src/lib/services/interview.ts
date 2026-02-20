/**
 * Video Interview Service
 * Integration with Jitsi Meet for video interviews
 * Alternative: Can be replaced with Twilio Video
 */

export interface InterviewSession {
  id: string;
  familyUserId: string;
  caregiverUserId: string;
  contractId?: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  scheduledAt: Date;
  durationMinutes: number;
  videoRoomUrl: string;
  videoProvider: "jitsi" | "twilio";
}

export interface InterviewQuestionnaire {
  communicationRating: number; // 1-5
  experienceRating: number; // 1-5
  punctualityRating: number; // 1-5
  wouldRecommend: boolean;
  notes?: string;
  proceedWithContract: boolean;
}

/**
 * Generate a unique room name for Jitsi
 */
export function generateRoomName(familyId: string, caregiverId: string): string {
  const hash = Buffer.from(`${familyId}-${caregiverId}-${Date.now()}`).toString('base64')
    .replace(/[+/=]/g, '')
    .substring(0, 20);
  return `idosolink-${hash}`;
}

/**
 * Generate Jitsi JWT token (if using authenticated Jitsi)
 * For public Jitsi, we just generate the room URL
 */
export function generateJitsiRoomUrl(roomName: string): string {
  // Using public Jitsi Meet instance
  // In production, use self-hosted Jitsi for privacy
  const jitsiDomain = process.env.JITSI_DOMAIN || "meet.jit.si";
  return `https://${jitsiDomain}/${roomName}`;
}

/**
 * Generate Jitsi JWT for authenticated rooms
 * Only needed if using Jitsi with authentication
 */
export async function generateJitsiJwt(
  roomName: string,
  userId: string,
  userName: string,
  isModerator: boolean = false
): Promise<string | null> {
  const appId = process.env.JITSI_APP_ID;
  const appSecret = process.env.JITSI_APP_SECRET;

  if (!appId || !appSecret) {
    // No JWT configured, use public room
    return null;
  }

  // JWT generation would go here
  // For now, return null to use public rooms
  return null;
}

/**
 * Calculate interview expiration time
 * Room is valid for 2 hours after scheduled time
 */
export function calculateExpirationTime(scheduledAt: Date, durationMinutes: number): Date {
  const expiration = new Date(scheduledAt);
  expiration.setHours(expiration.getHours() + 2);
  return expiration;
}

/**
 * Validate questionnaire responses
 */
export function validateQuestionnaire(data: Partial<InterviewQuestionnaire>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (data.communicationRating !== undefined) {
    if (data.communicationRating < 1 || data.communicationRating > 5) {
      errors.push("Communication rating must be between 1 and 5");
    }
  }

  if (data.experienceRating !== undefined) {
    if (data.experienceRating < 1 || data.experienceRating > 5) {
      errors.push("Experience rating must be between 1 and 5");
    }
  }

  if (data.punctualityRating !== undefined) {
    if (data.punctualityRating < 1 || data.punctualityRating > 5) {
      errors.push("Punctuality rating must be between 1 and 5");
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format questionnaire for storage
 */
export function formatQuestionnaireJson(questionnaire: InterviewQuestionnaire): string {
  return JSON.stringify({
    communicationRating: questionnaire.communicationRating,
    experienceRating: questionnaire.experienceRating,
    punctualityRating: questionnaire.punctualityRating,
    wouldRecommend: questionnaire.wouldRecommend,
    notes: questionnaire.notes || null,
    proceedWithContract: questionnaire.proceedWithContract,
    completedAt: new Date().toISOString(),
  });
}
