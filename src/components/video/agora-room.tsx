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

        // Create local tracks
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack();

        localAudioRef.current = audioTrack;
        localVideoRef.current = videoTrack;

        // Add event listeners
        client.on('user-published', async (user, mediaType) => {
          console.log('User published:', user.uid, mediaType);
          await client.subscribe(user, mediaType);

          if (mediaType === 'video') {
            const remoteVideoContainer = document.getElementById(`remote-${user.uid}`);
            if (remoteVideoContainer && user.videoTrack) {
              user.videoTrack.play(remoteVideoContainer);
            }
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
        });

        client.on('connection-state-change', (curState) => {
          console.log('Connection state changed:', curState);
        });

        // Join channel
        const userID = await client.join(
          process.env.NEXT_PUBLIC_AGORA_APP_ID!,
          channelName,
          token,
          uid
        );

        console.log('Joined channel, user ID:', userID);

        // Publish local tracks
        await client.publish([audioTrack, videoTrack]);
        console.log('Published local tracks');

        // Play local video
        if (containerRef.current) {
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

    initializeAgora();
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
    if (!localVideoRef.current) return;

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
  }, [isVideoEnabled]);

  // Loading state
  if (state === 'loading') {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-950 rounded-2xl ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20">
            <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-slate-300 font-medium">Conectando à chamada...</p>
          <p className="text-slate-500 text-sm">Inicializando Agora</p>
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
      {/* Local video container */}
      <div
        ref={containerRef}
        className="w-full h-full bg-slate-900"
        style={{ minHeight: '400px' }}
      />

      {/* Control bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 to-transparent p-4 flex items-center justify-center gap-3">
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
          className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
          title={isVideoEnabled ? "Desligar câmera" : "Ligar câmera"}
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
