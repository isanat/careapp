"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";
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

type MeetingState = 'permission-check' | 'loading' | 'prejoin' | 'in-meeting' | 'left' | 'error';

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
  const [meetingState, setMeetingState] = useState<MeetingState>('permission-check');
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check media permissions before loading Jitsi
  useEffect(() => {
    console.log('VideoRoom mounting with roomName:', roomName);
    checkPermissions();

    // Timeout if Jitsi takes too long to load
    const timeout = setTimeout(() => {
      if (meetingState === 'loading') {
        console.error('Jitsi failed to load within 15 seconds');
        setError('Timeout ao carregar o video. Verifique sua conexao e tente recarregar.');
        setMeetingState('error');
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [roomName, meetingState]);

  const checkPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMeetingState('loading');
    } catch (err: any) {
      console.warn('Media device check failed:', err.name, err.message);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setMeetingState('permission-check');
      } else if (err.name === 'NotFoundError') {
        // No devices found (common in test/VM environments)
        // Allow proceeding - Jitsi will handle missing devices gracefully
        console.log('No audio/video devices found, proceeding with Jitsi');
        setMeetingState('loading');
      } else {
        // Unknown error but allow proceeding to try with Jitsi
        console.log('Unknown media device error, proceeding with Jitsi');
        setMeetingState('loading');
      }
    }
  };

  const handleRetryPermission = async () => {
    setPermissionDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMeetingState('loading');
    } catch {
      setPermissionDenied(true);
    }
  };

  // Handle Jitsi API events
  const handleApiReady = useCallback((api: any) => {
    console.log('Jitsi API Ready for room:', roomName);

    api.addListener('videoConferenceJoined', () => {
      console.log('Jitsi: Video conference joined');
      setMeetingState('in-meeting');
    });

    api.addListener('videoConferenceLeft', () => {
      console.log('Jitsi: Video conference left');
      setMeetingState('left');
      onLeave?.();
    });

    api.addListener('readyToClose', () => {
      console.log('Jitsi: Ready to close');
      setMeetingState('left');
      onLeave?.();
    });

    api.addListener('errorOccurred', (errorData: any) => {
      console.error('Jitsi error:', errorData);

      // Format error message with helpful suggestions
      let errorMessage = errorData?.message || 'Erro desconhecido';

      // Handle common device-related errors
      if (errorData?.message?.includes('device') || errorData?.message?.includes('camera') || errorData?.message?.includes('microphone')) {
        errorMessage = 'Nao foi possivel acessar sua camera ou microfone. Verifique as permissoes do navegador e se os dispositivos estao conectados.';
      } else if (errorData?.message?.includes('connection') || errorData?.message?.includes('network')) {
        errorMessage = 'Erro de conexao. Verifique sua conexao com a Internet e tente novamente.';
      } else if (errorData?.message?.includes('conference') || errorData?.message?.includes('join')) {
        errorMessage = 'Erro ao entrar na sala. A sala pode nao existir ou pode estar lotada. Tente novamente.';
      }

      setError(errorMessage);
      setMeetingState('error');
      onError?.(new Error(errorData?.message || 'Erro desconhecido'));
    });

    setMeetingState(enablePrejoinPage ? 'prejoin' : 'in-meeting');
    onReady?.();
  }, [enablePrejoinPage, onReady, onLeave, onError, roomName]);

  // Handle loading error
  const handleLoadError = useCallback((loadErr: any) => {
    console.error('Failed to load Jitsi:', loadErr);
    setError('Falha ao carregar video. Verifique sua conexao.');
    setMeetingState('error');
    onError?.(new Error('Failed to load Jitsi'));
  }, [onError]);

  // Open in new tab as fallback
  const openInNewTab = useCallback(() => {
    const jitsiUrl = `https://meet.jit.si/${roomName}`;
    window.open(jitsiUrl, '_blank');
  }, [roomName]);

  // Permission check screen
  if (meetingState === 'permission-check' && permissionDenied) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl ${className}`}>
        <div className="max-w-sm mx-auto text-center px-6 py-12">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center ring-4 ring-amber-500/20">
            <IconVideo className="h-10 w-10 text-amber-400" />
          </div>

          <h3 className="text-xl font-bold text-white mb-3">
            Permissao Necessaria
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed mb-8">
            Para participar da entrevista em video, precisamos de acesso a sua
            <span className="text-white font-medium"> camera </span>
            e ao seu
            <span className="text-white font-medium"> microfone</span>.
          </p>

          {/* Step by step instructions */}
          <div className="bg-slate-800/50 rounded-xl p-4 mb-8 text-left space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Como permitir:</p>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">1</span>
              <p className="text-sm text-slate-300">Clique no icone de cadeado na barra do navegador</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">2</span>
              <p className="text-sm text-slate-300">Ative a <span className="text-white font-medium">Camera</span> e o <span className="text-white font-medium">Microfone</span></p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">3</span>
              <p className="text-sm text-slate-300">Clique em <span className="text-white font-medium">&quot;Tentar Novamente&quot;</span> abaixo</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              onClick={handleRetryPermission}
              className="w-full h-14 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
            >
              <IconVideo className="h-5 w-5 mr-2" />
              Tentar Novamente
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={openInNewTab}
              className="w-full h-12 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <IconExternalLink className="h-4 w-4 mr-2" />
              Abrir em nova aba
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (meetingState === 'error') {
    return (
      <div className={`flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl ${className}`}>
        <div className="max-w-sm mx-auto text-center px-6 py-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center ring-4 ring-red-500/20">
            <IconAlertCircle className="h-10 w-10 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Erro no Video</h3>
          <p className="text-slate-300 text-sm mb-8">{error}</p>
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              onClick={() => { setError(null); setMeetingState('loading'); }}
              className="w-full h-14 text-base font-semibold rounded-xl"
            >
              Tentar Novamente
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={openInNewTab}
              className="w-full h-12 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <IconExternalLink className="h-4 w-4 mr-2" />
              Abrir em Nova Aba
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Left meeting state
  if (meetingState === 'left') {
    return (
      <div className={`flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl ${className}`}>
        <div className="max-w-sm mx-auto text-center px-6 py-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-700/50 flex items-center justify-center ring-4 ring-slate-600/30">
            <IconPhoneOff className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Reuniao Encerrada</h3>
          <p className="text-slate-300 text-sm mb-8">A videoconferencia foi finalizada.</p>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setMeetingState('loading')}
            className="w-full h-14 text-base rounded-xl border-slate-600 text-white hover:bg-slate-800"
          >
            Reentrar na Reuniao
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-slate-950 ${className}`}>
      {/* Loading overlay */}
      {meetingState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20">
              <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="text-slate-300 font-medium">Carregando sala de video...</p>
            <p className="text-slate-500 text-sm">Isto pode levar alguns segundos</p>
          </div>
        </div>
      )}

      {/* Compact Header */}
      {subject && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 backdrop-blur border-b border-slate-800 z-10 relative">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
            <span className="font-medium text-white text-sm truncate">{subject}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isModerator && (
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Organizador</Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={openInNewTab}
              title="Abrir em nova aba"
              className="text-slate-400 hover:text-white h-8 w-8 p-0"
            >
              <IconExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Jitsi Meeting Container */}
      <div
        ref={containerRef}
        className="w-full"
        style={{ height: subject ? 'calc(100% - 42px)' : '100%', minHeight: '500px' }}
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
            },
            // Disable speaker-selection feature to avoid "Unrecognized feature" warning
            'features.speaker-selection': {
              enabled: false
            },
            // Disable features that might not be available
            analytics: {
              disabled: true
            },
            // Allow continuing even if devices aren't available
            disallowMixedAudio: false,
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
              iframeRef.style.borderRadius = '0';
              iframeRef.style.height = '100%';
              iframeRef.style.width = '100%';
            }
          }}
        />
      </div>
    </div>
  );
}

export default VideoRoom;
