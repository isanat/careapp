'use client';

/**
 * QR Scanner Component
 * Allows caregivers to scan QR codes for presence confirmation
 * Features: Camera capture, manual input, validation, confirmation
 */

import React, { useRef, useState, useEffect } from 'react';
import { useQRCode } from '@/hooks/useQRCode';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Volume2,
} from 'lucide-react';

interface QRScannerProps {
  onScanSuccess?: (result: any) => void;
  onScanError?: (error: string) => void;
}

export function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const { scanQR, scanning, scanError, scanSuccess, clearScanSuccess, clearErrors } =
    useQRCode();

  const [manualInput, setManualInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera
  const initCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);

        // Start scanning
        scanCamera();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao aceder à câmara';
      setCameraError(message);
    }
  };

  // Scan camera continuously
  const scanCamera = () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

    // Get image data
    const imageData = ctx.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    // Simple QR code detection: look for EVY- pattern
    // In production, use a proper QR code library like jsqr
    // For now, we'll rely on manual input as fallback

    // Continue scanning
    if (cameraActive) {
      requestAnimationFrame(scanCamera);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Handle manual scan
  const handleManualScan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!manualInput.trim()) {
      onScanError?.('Introduz um código QR');
      return;
    }

    try {
      clearErrors();
      const result = await scanQR(manualInput.toUpperCase().trim());
      setManualInput('');
      onScanSuccess?.(result);

      // Play sound
      playSuccessSound();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao escanear';
      onScanError?.(message);
    }
  };

  // Play success sound
  const playSuccessSound = () => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch {
      // Fallback: silent if audio fails
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="w-full space-y-4">
      {/* Error Alert */}
      {(scanError || cameraError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{scanError || cameraError}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {scanSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✓ {scanSuccess.message}
            {scanSuccess.confirmation.confirmedBy && (
              <p className="mt-1 text-sm">
                Confirmado por {scanSuccess.confirmation.confirmedBy.name} em{' '}
                {new Date(scanSuccess.confirmation.confirmedAt).toLocaleTimeString('pt-PT')}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Scanner Card */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Escanear Código QR
            </h3>
            <p className="text-sm text-gray-600">
              Escaneia o código QR para confirmar a tua presença
            </p>
          </div>

          {/* Camera Section */}
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full aspect-video object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                    width={320}
                    height={240}
                  />
                </>
              ) : (
                <div className="w-full aspect-video bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Câmara desativada</p>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex gap-3">
              {!cameraActive ? (
                <Button
                  onClick={initCamera}
                  disabled={scanning}
                  className="flex-1 gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Ativar Câmara
                </Button>
              ) : (
                <Button
                  onClick={stopCamera}
                  variant="destructive"
                  className="flex-1 gap-2"
                >
                  <X className="h-4 w-4" />
                  Desativar Câmara
                </Button>
              )}
            </div>
          </div>

          {/* Manual Input */}
          <div className="border-t pt-6">
            <h4 className="text-sm font-medium mb-3">
              Ou introduz o código manualmente
            </h4>

            <form onSubmit={handleManualScan} className="space-y-3">
              <Input
                placeholder="Ex: EVY-ABC123DEF456"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                className="font-mono text-lg tracking-wider"
                disabled={scanning}
              />

              <Button
                type="submit"
                disabled={scanning || !manualInput.trim()}
                className="w-full gap-2"
              >
                {scanning ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    A processar...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Confirmar Código
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Como funciona:</strong>
            </p>
            <ul className="text-sm text-blue-900 mt-2 space-y-1 ml-4 list-disc">
              <li>Ativa a câmara ou introduz o código manualmente</li>
              <li>Aponta a câmara para o código QR</li>
              <li>Ouve um som de confirmação quando escaneado com sucesso</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
