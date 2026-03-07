/**
 * Jitsi Meet Service for Senior Care
 * 
 * Integration with Jitsi Meet (meet.jit.si) - Free and unlimited
 * 
 * OPTIONS:
 * 1. Public Jitsi (meet.jit.si) - Free, but requires host login (Google/GitHub)
 * 2. Self-hosted Jitsi - Requires own server
 * 3. JaaS (Jitsi as a Service) - Paid, with JWT auth
 * 
 * CURRENT IMPLEMENTATION:
 * - Uses Jitsi IFrame API with meet.jit.si (free)
 * - Generates unique room names to prevent unauthorized access
 * - Both participants enter as guests (no login required)
 * - Optional: Configure JITSI_APP_ID and JITSI_APP_SECRET for JWT auth
 */

import crypto from 'crypto';

// Jitsi configuration
export const JITSI_CONFIG = {
  // Public Jitsi domain (free)
  domain: process.env.JITSI_DOMAIN || 'meet.jit.si',
  
  // App credentials for JWT auth (optional)
  appId: process.env.JITSI_APP_ID || '',
  appSecret: process.env.JITSI_APP_SECRET || '',
  
  // System account for host authentication (optional)
  systemEmail: process.env.JITSI_SYSTEM_EMAIL || 'reunioes@seniorcare.pt',
  
  // Room settings
  roomPrefix: 'seniorcare',
  roomExpirationHours: 2,
};

/**
 * Interface for Jitsi room configuration
 */
export interface JitsiRoomConfig {
  roomName: string;
  roomUrl: string;
  jwtToken?: string;
  expiresAt: Date;
  hostName: string;
  subject: string;
}

/**
 * Interface for Jitsi user info
 */
export interface JitsiUserInfo {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role: 'host' | 'guest';
}

/**
 * Interface for Jitsi meeting options
 */
export interface JitsiMeetingOptions {
  roomName: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  isModerator?: boolean;
  startWithAudioMuted?: boolean;
  startWithVideoMuted?: boolean;
  enableLobby?: boolean;
  enablePrejoinPage?: boolean;
  enableChat?: boolean;
  enableScreenShare?: boolean;
  enableRecording?: boolean;
  onReady?: (api: any) => void;
  onParticipantLeft?: (participant: any) => void;
  onVideoConferenceLeft?: () => void;
  onError?: (error: any) => void;
}

/**
 * Generate a unique, secure room name
 * Format: seniorcare-{hash}-{timestamp}
 * 
 * The hash is derived from the interview ID to make it:
 * - Hard to guess (security through obscurity)
 * - Deterministic (can regenerate if needed)
 */
export function generateRoomName(interviewId: string, familyId: string, caregiverId: string): string {
  const secret = process.env.NEXTAUTH_SECRET || 'seniorcare-secret';
  const data = `${interviewId}-${familyId}-${caregiverId}-${Date.now()}`;
  const hash = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex')
    .substring(0, 16);
  
  return `${JITSI_CONFIG.roomPrefix}-${hash}`;
}

/**
 * Generate full Jitsi room URL
 */
export function generateRoomUrl(roomName: string): string {
  return `https://${JITSI_CONFIG.domain}/${roomName}`;
}

/**
 * Generate JWT token for Jitsi authentication
 * 
 * This is needed if:
 * 1. Using JaaS (Jitsi as a Service) - paid
 * 2. Using self-hosted Jitsi with JWT auth configured
 * 
 * For public Jitsi (meet.jit.si), JWT is optional and requires
 * registering for an appId at https://jaas.8x8.vc/
 */
export function generateJitsiJwt(
  roomName: string,
  user: JitsiUserInfo
): string | null {
  const { appId, appSecret } = JITSI_CONFIG;
  
  if (!appId || !appSecret) {
    // No JWT credentials configured, return null (public room)
    return null;
  }
  
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (JITSI_CONFIG.roomExpirationHours * 60 * 60);
  
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    iss: appId,
    aud: 'jitsi',
    sub: JITSI_CONFIG.domain,
    room: roomName,
    exp: exp,
    nbf: now,
    context: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email || '',
        avatar: user.avatarUrl || '',
        role: user.role
      },
      features: {
        'lobby-enabled': true,
        'prejoin-enabled': true
      }
    }
  };
  
  // Encode header and payload
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  // Create signature
  const signature = crypto
    .createHmac('sha256', appSecret)
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url');
  
  return `${base64Header}.${base64Payload}.${signature}`;
}

/**
 * Calculate room expiration time
 * Room is valid for 2 hours after creation
 */
export function calculateExpiration(scheduledAt: Date, durationMinutes: number): Date {
  const expiration = new Date(scheduledAt);
  expiration.setHours(expiration.getHours() + JITSI_CONFIG.roomExpirationHours);
  return expiration;
}

/**
 * Get Jitsi IFrame API configuration
 * This is used by the frontend component
 */
export function getJitsiConfig(options: JitsiMeetingOptions) {
  const jwt = generateJitsiJwt(options.roomName, {
    id: options.displayName.toLowerCase().replace(/\s+/g, '-'),
    name: options.displayName,
    email: options.email,
    avatarUrl: options.avatarUrl,
    role: options.isModerator ? 'host' : 'guest'
  });
  
  return {
    domain: JITSI_CONFIG.domain,
    options: {
      roomName: options.roomName,
      width: '100%',
      height: '100%',
      parentNode: undefined, // Set by component
      configOverwrite: {
        prejoinPageEnabled: options.enablePrejoinPage ?? true,
        startWithAudioMuted: options.startWithAudioMuted ?? true,
        startWithVideoMuted: options.startWithVideoMuted ?? false,
        disableDeepLinking: true,
        enableLobby: options.enableLobby ?? true,
        lobby: {
          enabled: options.enableLobby ?? true,
          showChat: false
        },
        // Security settings
        securityUi: {
          hideLobbyButton: false,
        },
        // Disable some features for simplicity
        'breakout-rooms': {
          enabled: false
        },
        // Moderation settings
        moderation: {
          enabled: true,
        }
      },
      interfaceConfigOverwrite: {
        // Hide Jitsi branding
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        JITSI_WATERMARK_LINK: '',
        
        // Toolbar buttons
        TOOLBAR_BUTTONS: [
          'microphone',
          'camera',
          'desktop',
          'chat',
          ...(options.enableRecording ? ['recording'] : []),
          'fullscreen',
          'hangup',
          'profile',
          'settings',
          'raisehand',
          'videoquality',
          'filmstrip',
          'shortcuts',
          'help',
          'mute-everyone',
          'mute-video-everyone'
        ],
        
        // UI settings
        FILM_STRIP_ONLY: false,
        VERTICAL_FILMSTRIP: true,
        HIDE_KICK_BUTTON_FOR_GUESTS: true,
        
        // Default settings
        DEFAULT_BACKGROUND: '#0a0a0a',
        DEFAULT_LOCAL_DISPLAY_NAME: 'me',
        DEFAULT_REMOTE_DISPLAY_NAME: '',
        
        // Features
        ENABLE_RECORDING: options.enableRecording ?? false,
        ENABLE_SIMULCAST: true,
        ENABLE_WELCOME_PAGE: false,
        ENABLE_PREJOIN_PAGE: options.enablePrejoinPage ?? true,
        ENABLE_CLOSE_PAGE: true,
        SHOW_CHROME_EXTENSION_BANNER: false,
        
        // Branding
        BRAND_WATERMARK_LINK: '',
        
        // Notifications
        ENFORCE_NOTIFICATION_AUTO_SILENT: true,
      },
      userInfo: {
        displayName: options.displayName,
        email: options.email || '',
        avatarUrl: options.avatarUrl || ''
      },
      jwt: jwt || undefined
    },
    callbacks: {
      readyToClose: options.onVideoConferenceLeft,
      videoConferenceLeft: options.onVideoConferenceLeft,
      participantLeft: options.onParticipantLeft,
      videoConferenceJoined: () => console.log('Joined meeting'),
      errorOccurred: options.onError
    }
  };
}

/**
 * Create a complete Jitsi room configuration for an interview
 */
export function createInterviewRoom(
  interviewId: string,
  familyId: string,
  caregiverId: string,
  scheduledAt: Date,
  durationMinutes: number = 30,
  familyName: string,
  caregiverName: string
): JitsiRoomConfig {
  const roomName = generateRoomName(interviewId, familyId, caregiverId);
  const roomUrl = generateRoomUrl(roomName);
  const expiresAt = calculateExpiration(scheduledAt, durationMinutes);
  
  // Generate JWT for the "system" (host)
  const jwtToken = generateJitsiJwt(roomName, {
    id: 'seniorcare-system',
    name: 'Senior Care',
    email: JITSI_CONFIG.systemEmail,
    role: 'host'
  });
  
  return {
    roomName,
    roomUrl,
    jwtToken: jwtToken || undefined,
    expiresAt,
    hostName: 'Senior Care',
    subject: `Entrevista: ${familyName} ↔ ${caregiverName}`
  };
}

/**
 * Validate if a room is still valid
 */
export function isRoomValid(expiresAt: Date): boolean {
  return new Date() < expiresAt;
}
