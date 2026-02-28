"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  IconVideo, 
  IconLoader2, 
  IconAlertCircle,
  IconExternalLink,
  IconPhoneOff
} from "@/components/icons";

export interface VideoRoomProps {
  roomName: string;
  displayName: string;
  email?: string;
  subject?: string;
  isModerator?: boolean;
  startWithAudioMuted?: boolean;
  startWithVideoMuted?: boolean;
  enableLobby?: boolean;
  enablePrejoinPage?: boolean;
  enableRecording?: boolean;
  onReady?: () => void;
  onLeave?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

type MeetingState = 'loading' | 'prejoin' | 'in-meeting' | 'left' | 'error';

export function VideoRoom({
  roomName,
  displayName,
  email,
  subject,
  isModerator = false,
  startWithAudioMuted = true,
  startWithVideoMuted = false,
  enableLobby = true,
  enablePrejoinPage = true,
  enableRecording = false,
  onReady,
  onLeave,
  onError,
  className = ""
}: VideoRoomProps) {
  const [meetingState, setMeetingState] = useState<MeetingState>('loading');
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle Jitsi API events
  const handleApiReady = useCallback((api: any) => {
    console.log('Jitsi API ready', api);
    
    // Register event listeners
    api.addListener('videoConferenceJoined', () => {
      console.log('Joined video conference');
      setMeetingState('in-meeting');
    });
    
    api.addListener('videoConferenceLeft', () => {
      console.log('Left video conference');
      setMeetingState('left');
      onLeave?.();
    });
    
    api.addListener('participantLeft', (participant: any) => {
      console.log('Participant left:', participant);
    });
    
    api.addListener('readyToClose', () => {
      console.log('Meeting ready to close');
      setMeetingState('left');
      onLeave?.();
    });
    
    api.addListener('errorOccurred', (errorData: any) => {
      console.error('Jitsi error:', errorData);
      setError(errorData?.message || 'Erro desconhecido');
      setMeetingState('error');
      onError?.(new Error(errorData?.message || 'Erro desconhecido'));
    });
    
    setMeetingState(enablePrejoinPage ? 'prejoin' : 'in-meeting');
    onReady?.();
  }, [enablePrejoinPage, onReady, onLeave, onError]);

  // Handle loading error
  const handleLoadError = useCallback((error: any) => {
    console.error('Failed to load Jitsi:', error);
    setError('Falha ao carregar vídeo. Verifique sua conexão.');
    setMeetingState('error');
    onError?.(new Error('Failed to load Jitsi'));
  }, [onError]);

  // Open in new tab as fallback
  const openInNewTab = useCallback(() => {
    const jitsiUrl = `https://meet.jit.si/${roomName}`;
    window.open(jitsiUrl, '_blank');
  }, [roomName]);

  // Error state
  if (meetingState === 'error') {
    return (
      <Card className={`border-destructive/20 ${className}`}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <IconAlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro no Vídeo</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setError(null);
              setMeetingState('loading');
            }}>
              Tentar Novamente
            </Button>
            <Button onClick={openInNewTab}>
              <IconExternalLink className="h-4 w-4 mr-2" />
              Abrir em Nova Aba
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Left meeting state
  if (meetingState === 'left') {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <IconPhoneOff className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Reunião Encerrada</h3>
          <p className="text-muted-foreground mb-4">
            A videoconferência foi finalizada.
          </p>
          <Button variant="outline" onClick={() => {
            setMeetingState('loading');
          }}>
            Reentrar na Reunião
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading overlay */}
      {meetingState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50 rounded-lg">
          <div className="flex flex-col items-center gap-4">
            <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando sala de vídeo...</p>
          </div>
        </div>
      )}

      {/* Header */}
      {subject && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-t-lg border-b">
          <div className="flex items-center gap-2">
            <IconVideo className="h-5 w-5 text-primary" />
            <span className="font-medium">{subject}</span>
          </div>
          <div className="flex items-center gap-2">
            {isModerator && (
              <Badge variant="secondary">Organizador</Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={openInNewTab}
              title="Abrir em nova aba"
            >
              <IconExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Jitsi Meeting Container */}
      <div 
        ref={containerRef}
        className="w-full h-full min-h-[500px] rounded-b-lg overflow-hidden"
        style={{ height: subject ? 'calc(100% - 52px)' : '100%' }}
      >
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={roomName}
          configOverwrite={{
            prejoinPageEnabled: enablePrejoinPage,
            startWithAudioMuted: startWithAudioMuted,
            startWithVideoMuted: startWithVideoMuted,
            disableDeepLinking: true,
            enableLobby: enableLobby,
            lobby: {
              enabled: enableLobby,
              showChat: false
            },
            securityUi: {
              hideLobbyButton: false,
            },
            'breakout-rooms': {
              enabled: false
            },
            moderation: {
              enabled: true,
            }
          } as any}
          interfaceConfigOverwrite={{
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            JITSI_WATERMARK_LINK: '',
            
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'desktop',
              'chat',
              ...(enableRecording ? ['recording'] : []),
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
            
            FILM_STRIP_ONLY: false,
            VERTICAL_FILMSTRIP: true,
            HIDE_KICK_BUTTON_FOR_GUESTS: true,
            
            DEFAULT_BACKGROUND: '#0a0a0a',
            DEFAULT_LOCAL_DISPLAY_NAME: 'eu',
            DEFAULT_REMOTE_DISPLAY_NAME: '',
            
            ENABLE_RECORDING: enableRecording,
            ENABLE_SIMULCAST: true,
            ENABLE_WELCOME_PAGE: false,
            ENABLE_PREJOIN_PAGE: enablePrejoinPage,
            ENABLE_CLOSE_PAGE: true,
            SHOW_CHROME_EXTENSION_BANNER: false,
            
            BRAND_WATERMARK_LINK: '',
            ENFORCE_NOTIFICATION_AUTO_SILENT: true,
          }}
          userInfo={{
            displayName: displayName,
            email: email || '',
          }}
          onApiReady={handleApiReady}
          {...{ onError: handleLoadError } as any}
          getIFrameRef={(iframeRef) => {
            if (iframeRef) {
              iframeRef.style.borderRadius = '0 0 0.5rem 0.5rem';
            }
          }}
        />
      </div>
    </div>
  );
}

export default VideoRoom;
