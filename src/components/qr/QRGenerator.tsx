'use client';

/**
 * QR Generator Component
 * Allows families to generate daily QR codes for presence confirmation
 * Features: Generate, display, copy, share, countdown timer
 */

import React, { useEffect, useState } from 'react';
import { useQRCode } from '@/hooks/useQRCode';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Share2, Printer, RotateCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface QRGeneratorProps {
  contractId: string;
  caregiverName?: string;
  onQRGenerated?: (qrCode: string) => void;
}

export function QRGenerator({
  contractId,
  caregiverName = 'Profissional',
  onQRGenerated,
}: QRGeneratorProps) {
  const { generateQR, generatingQR, generationError, qrData, clearErrors } =
    useQRCode();

  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Load existing QR on mount
  useEffect(() => {
    if (!hasGenerated && contractId) {
      handleGenerateQR();
    }
  }, [contractId, hasGenerated]);

  // Countdown timer
  useEffect(() => {
    if (!qrData) return;

    const interval = setInterval(() => {
      const expiresAt = new Date(qrData.expiresAt);
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expirado');
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [qrData]);

  const handleGenerateQR = async () => {
    try {
      clearErrors();
      const data = await generateQR(contractId);
      setHasGenerated(true);
      onQRGenerated?.(data.qrCode);
    } catch (error) {
      console.error('Erro ao gerar QR:', error);
    }
  };

  const handleCopy = () => {
    if (qrData?.qrCode) {
      navigator.clipboard.writeText(qrData.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (!qrData?.qrCode) return;

    const text = `QR Code: ${qrData.qrCode}\n\nValidade: ${timeRemaining}\n\nPor favor, escaneia este código quando chegares para confirmar a tua presença.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePrint = () => {
    if (!qrData?.qrCode) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Código QR - Confirmação de Presença</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: #f5f5f5;
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 8px;
                text-align: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              h1 {
                margin-bottom: 30px;
                color: #333;
              }
              .qr-code {
                font-size: 32px;
                font-weight: bold;
                font-family: monospace;
                margin: 20px 0;
                padding: 20px;
                background: #f9f9f9;
                border: 2px solid #ddd;
                border-radius: 4px;
              }
              .expiry {
                margin-top: 20px;
                color: #666;
              }
              @media print {
                body { background: white; }
                .container { box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Código QR - Confirmação de Presença</h1>
              <div class="qr-code">${qrData.qrCode}</div>
              <p class="expiry">Válido até: ${new Date(qrData.expiresAt).toLocaleString('pt-PT')}</p>
              <p>O profissional deve escanear este código quando chegar para confirmar a sua presença.</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Error Alert */}
      {generationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{generationError}</AlertDescription>
        </Alert>
      )}

      {/* QR Code Card */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Código QR do Dia
            </h3>
            <p className="text-sm text-gray-600">
              Compartilha este código com {caregiverName} para confirmar a presença
            </p>
          </div>

          {/* QR Code Display */}
          {qrData ? (
            <>
              {/* QR Code Box */}
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="bg-white p-6 rounded-lg inline-block border-2 border-gray-200">
                  <div className="text-4xl font-mono font-bold text-gray-900 tracking-widest">
                    {qrData.qrCode}
                  </div>
                </div>
              </div>

              {/* Time Remaining */}
              {timeRemaining && (
                <div className="flex items-center justify-center gap-2 text-center">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Válido por</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {timeRemaining}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Copy Button */}
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="hidden sm:inline">Copiar</span>
                    </>
                  )}
                </Button>

                {/* Share Button */}
                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </Button>

                {/* Print Button */}
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">Imprimir</span>
                </Button>

                {/* Regenerate Button */}
                <Button
                  onClick={handleGenerateQR}
                  variant="outline"
                  size="sm"
                  disabled={generatingQR}
                  className="gap-2"
                >
                  <RotateCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Novo</span>
                </Button>
              </div>

              {/* Info Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  💡 <strong>Dica:</strong> O código expira em 24 horas. Compartilha via WhatsApp para facilitar.
                </p>
              </div>
            </>
          ) : (
            /* Loading State */
            <div className="text-center py-8">
              {generatingQR ? (
                <>
                  <div className="animate-spin h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
                  <p className="text-gray-600">A gerar código QR...</p>
                </>
              ) : (
                <Button onClick={handleGenerateQR} size="lg">
                  Gerar QR Code
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
