"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import AgoraRTC, { IAgoraRTCClient, ILocalAudioTrack, ILocalVideoTrack } from "agora-rtc-sdk-ng";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IconVideo,
  IconLoader2,
  IconAlertCircle,
  IconExternalLink,
  IconPhoneOff,
  IconMic,
  IconMicOff,
  IconVideoOff,
} from "@/components/icons";

export interface AgoraRoomProps {
  channelName: string;
  displayName: string;
  onReady?: () => void;
  onLeave?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

type AgoraState = 'init' | 'loading' | 'joined' | 'left' | 'error';

export function AgoraRoom({
  channelName,
  displayName,
  onReady,
  onLeave,
  onError,
  className = ""
}: AgoraRoomProps) {
  const [state, setState] = useState<AgoraState>('init');
  const [error, setError] = useState<string | null>(null);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [hasVideoDevice, setHasVideoDevice] = useState(true);
  const [remoteUsers, setRemoteUsers] = useState<{ [key: number]: boolean }>({});

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioRef = useRef<ILocalAudioTrack | null>(null);
  const localVideoRef = useRef<ILocalVideoTrack | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Agora client and join channel
  useEffect(() => {
    if (state !== 'init') return;

    const initializeAgora = async () => {
      try {
        setState('loading');
        console.log('Initializing Agora client for channel:', channelName);

        // Create Agora client
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp9" });
        clientRef.current = client;

        // Get token from backend
        const tokenResponse = await fetch('/api/agora/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelName }),
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to get Agora token');
        }

        const { token, uid } = await tokenResponse.json();
        console.log('Got Agora token for UID:', uid);

        // Create local audio track
        let audioTrack: ILocalAudioTrack;
        try {
          audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          localAudioRef.current = audioTrack;
          console.log('✓ Microphone audio track created');
        } catch (err: any) {
          console.error('✗ Microfone erro:', err.message);
          throw new Error(`Erro ao acessar microfone: ${err.message}`);
        }

        // Try to create video track, fallback to audio-only if camera not available
        let videoTrack: ILocalVideoTrack | null = null;
        let hasCamera = true;
        try {
          console.log('Tentando acessar câmera...');
          videoTrack = await AgoraRTC.createCameraVideoTrack();
          localVideoRef.current = videoTrack;
          console.log('✓ Camera video track created');
        } catch (err: any) {
          console.warn('⚠ Câmera não disponível, continuando apenas com áudio:', err.message);
          setHasVideoDevice(false);
          hasCamera = false;
        }

        // Add event listeners
        client.on('user-published', async (user, mediaType) => {
          console.log('User published:', user.uid, mediaType);
          await client.subscribe(user, mediaType);

          // Track remote users
          setRemoteUsers(prev => ({ ...prev, [user.uid]: true }));

          if (mediaType === 'video') {
            // Render video after a small delay to ensure container exists
            setTimeout(() => {
              const remoteVideoContainer = document.getElementById(`remote-${user.uid}`);
              if (remoteVideoContainer && user.videoTrack) {
                console.log('Playing remote video for user:', user.uid);
                user.videoTrack.play(remoteVideoContainer);
              }
            }, 100);
          }

          if (mediaType === 'audio' && user.audioTrack) {
            user.audioTrack.play();
          }
        });

        client.on('user-unpublished', (user, mediaType) => {
          console.log('User unpublished:', user.uid, mediaType);
        });

        client.on('user-left', (user) => {
          console.log('User left:', user.uid);
          setRemoteUsers(prev => {
            const updated = { ...prev };
            delete updated[user.uid];
            return updated;
          });
        });

        client.on('connection-state-change', (curState) => {
          console.log('Connection state changed:', curState);
        });

        // Join channel - uid=0 lets Agora auto-assign a numeric UID
        const userID = await client.join(
          process.env.NEXT_PUBLIC_AGORA_APP_ID!,
          channelName,
          token,
          0
        );

        console.log('Joined channel, user ID:', userID);

        // Publish local tracks (audio only if video unavailable)
        const tracksToPublish: Array<ILocalAudioTrack | ILocalVideoTrack> = [audioTrack];
        if (videoTrack) {
          tracksToPublish.push(videoTrack);
        }
        await client.publish(tracksToPublish);
        console.log('Published local tracks:', hasCamera ? 'audio+video' : 'audio-only');

        // Play local video if available
        if (videoTrack && containerRef.current) {
          videoTrack.play(containerRef.current);
        }

        setState('joined');
        onReady?.();
      } catch (err: any) {
        console.error('Agora initialization error:', err);
        const errorMsg = err.message || 'Failed to initialize video call';
        setError(errorMsg);
        setState('error');
        onError?.(new Error(errorMsg));
      }
    };

    // Add 30-second timeout to prevent hanging on permission requests
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Inicialização expirou. Verifique permissões de câmera/microfone.')), 30000)
    );

    Promise.race([initializeAgora(), timeoutPromise]).catch((err) => {
      console.error('Agora initialization error:', err);
      setError(err.message || 'Falha ao inicializar video');
      setState('error');
      onError?.(new Error(err.message || 'Falha ao inicializar video'));
    });
  }, [state, channelName, onReady, onError]);

  const handleLeave = useCallback(async () => {
    try {
      if (localAudioRef.current) {
        localAudioRef.current.close();
        localAudioRef.current = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.close();
        localVideoRef.current = null;
      }

      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }

      setState('left');
      onLeave?.();
    } catch (err) {
      console.error('Error leaving channel:', err);
    }
  }, [onLeave]);

  const handleToggleMic = useCallback(async () => {
    if (!localAudioRef.current) return;

    try {
      if (isMicEnabled) {
        await localAudioRef.current.setEnabled(false);
        setIsMicEnabled(false);
      } else {
        await localAudioRef.current.setEnabled(true);
        setIsMicEnabled(true);
      }
    } catch (err) {
      console.error('Error toggling mic:', err);
    }
  }, [isMicEnabled]);

  const handleToggleVideo = useCallback(async () => {
    if (!localVideoRef.current || !hasVideoDevice) return;

    try {
      if (isVideoEnabled) {
        await localVideoRef.current.setEnabled(false);
        setIsVideoEnabled(false);
      } else {
        await localVideoRef.current.setEnabled(true);
        setIsVideoEnabled(true);
      }
    } catch (err) {
      console.error('Error toggling video:', err);
    }
  }, [isVideoEnabled, hasVideoDevice]);

  // Loading state
  if (state === 'loading') {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-950 rounded-2xl ${className}`} style={{ minHeight: '400px' }}>
        <div className="flex flex-col items-center gap-4 px-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20">
            <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-slate-300 font-medium text-center">Conectando à chamada...</p>
          <p className="text-slate-500 text-sm text-center">
            Se está travado por mais de 30s, verifique as permissões de câmera/microfone no seu telefone.
          </p>
          <div className="mt-4 w-full max-w-xs bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400 text-center">
            <p>Verifique: Configurações → Aplicativo → Permissões</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-950 rounded-2xl ${className}`}>
        <div className="max-w-sm mx-auto text-center px-6 py-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center ring-4 ring-red-500/20">
            <IconAlertCircle className="h-10 w-10 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Erro no Video</h3>
          <p className="text-slate-300 text-sm mb-8">{error}</p>
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              onClick={() => {
                setState('init');
                setError(null);
              }}
              className="w-full"
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Left state
  if (state === 'left') {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-950 rounded-2xl ${className}`}>
        <div className="max-w-sm mx-auto text-center px-6 py-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-700/50 flex items-center justify-center ring-4 ring-slate-600/30">
            <IconPhoneOff className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Reunião Encerrada</h3>
          <p className="text-slate-300 text-sm mb-8">A videoconferência foi finalizada.</p>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setState('init')}
            className="w-full h-14 text-base rounded-xl border-slate-600 text-white hover:bg-slate-800"
          >
            Reentrar na Reunião
          </Button>
        </div>
      </div>
    );
  }

  // Joined state
  return (
    <div className={`relative rounded-2xl overflow-hidden bg-slate-950 ${className}`}>
      <div className="w-full h-full flex flex-col" style={{ minHeight: '400px' }}>
        {/* Remote videos grid */}
        <div className="flex-1 bg-slate-900 grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
          {/* Remote user videos */}
          {Object.keys(remoteUsers).length > 0 ? (
            Object.keys(remoteUsers).map((uid) => (
              <div
                key={uid}
                id={`remote-${uid}`}
                className="bg-slate-800 rounded-lg overflow-hidden"
                style={{ minHeight: '200px' }}
              />
            ))
          ) : (
            <div className="col-span-full flex items-center justify-center text-slate-400">
              <p>Aguardando outro participante...</p>
            </div>
          )}
        </div>

        {/* Local video - small preview if we have it */}
        {hasVideoDevice && (
          <div className="absolute bottom-20 right-4 w-24 h-24 bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-600">
            <div ref={containerRef} className="w-full h-full" />
          </div>
        )}

        {/* Local video message if no camera */}
        {!hasVideoDevice && Object.keys(remoteUsers).length === 0 && (
          <div
            ref={containerRef}
            className="flex-1 bg-slate-900 flex flex-col items-center justify-center"
          >
            <IconVideoOff className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-300 font-medium mb-1">Câmera não disponível</p>
            <p className="text-slate-500 text-sm">Conectado apenas com áudio. Você pode continuar a conversa normalmente.</p>
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent p-4 flex items-center justify-center gap-3 z-10">
        <Button
          variant={isMicEnabled ? "default" : "destructive"}
          size="lg"
          onClick={handleToggleMic}
          className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
          title={isMicEnabled ? "Desligar microfone" : "Ligar microfone"}
        >
          {isMicEnabled ? (
            <IconMic className="h-5 w-5" />
          ) : (
            <IconMicOff className="h-5 w-5" />
          )}
        </Button>

        <Button
          variant={isVideoEnabled ? "default" : "destructive"}
          size="lg"
          onClick={handleToggleVideo}
          disabled={!hasVideoDevice}
          className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
          title={hasVideoDevice ? (isVideoEnabled ? "Desligar câmera" : "Ligar câmera") : "Câmera não disponível"}
        >
          {isVideoEnabled ? (
            <IconVideo className="h-5 w-5" />
          ) : (
            <IconVideoOff className="h-5 w-5" />
          )}
        </Button>

        <Button
          variant="destructive"
          size="lg"
          onClick={handleLeave}
          className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
          title="Sair da chamada"
        >
          <IconPhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

export default AgoraRoom;
