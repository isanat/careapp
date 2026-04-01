/**
 * Custom Hook: useQRCode
 * Manages QR code generation, scanning, and history retrieval
 */

import { useState, useCallback } from "react";

export interface QRCodeData {
  qrCodeId: string;
  qrCode: string;
  expiresAt: string;
  expiresIn: number;
  generatedAt: string;
  contractId: string;
}

export interface ScanResult {
  success: boolean;
  message: string;
  confirmation: {
    qrCodeId: string;
    contractId: string;
    confirmedAt: string;
    confirmedBy: {
      id: string;
      name: string;
    };
    status: string;
  };
}

export interface HistoryItem {
  qrCodeId: string;
  qrCode: string;
  generatedAt: string;
  expiresAt: string;
  status: "pending" | "confirmed" | "expired";
  scannedAt: string | null;
  scannedBy: {
    id: string;
    name: string;
  } | null;
}

export interface UseQRCodeReturn {
  // Generate
  generateQR: (contractId: string) => Promise<QRCodeData>;
  generatingQR: boolean;
  generationError: string | null;
  qrData: QRCodeData | null;

  // Scan
  scanQR: (qrCode: string) => Promise<ScanResult>;
  scanning: boolean;
  scanError: string | null;
  scanSuccess: ScanResult | null;

  // History
  fetchHistory: (
    contractId: string,
    options?: { limit?: number; offset?: number; status?: string }
  ) => Promise<any>;
  loadingHistory: boolean;
  historyError: string | null;
  historyData: {
    total: number;
    limit: number;
    offset: number;
    history: HistoryItem[];
  } | null;

  // Utils
  clearErrors: () => void;
  clearScanSuccess: () => void;
}

export function useQRCode(): UseQRCodeReturn {
  // Generate state
  const [generatingQR, setGeneratingQR] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [qrData, setQRData] = useState<QRCodeData | null>(null);

  // Scan state
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<ScanResult | null>(null);

  // History state
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<any>(null);

  // Generate QR
  const generateQR = useCallback(
    async (contractId: string): Promise<QRCodeData> => {
      setGeneratingQR(true);
      setGenerationError(null);

      try {
        const response = await fetch(
          `/api/contracts/${contractId}/qr/generate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Erro ao gerar código QR"
          );
        }

        const data = await response.json();
        setQRData(data);
        return data;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro desconhecido";
        setGenerationError(message);
        throw error;
      } finally {
        setGeneratingQR(false);
      }
    },
    []
  );

  // Scan QR
  const scanQR = useCallback(
    async (qrCode: string): Promise<ScanResult> => {
      setScanning(true);
      setScanError(null);

      try {
        const response = await fetch("/api/qr/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrCode }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Erro ao escanear código QR"
          );
        }

        const data = await response.json();
        setScanSuccess(data);
        return data;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro desconhecido";
        setScanError(message);
        throw error;
      } finally {
        setScanning(false);
      }
    },
    []
  );

  // Fetch history
  const fetchHistory = useCallback(
    async (
      contractId: string,
      options: { limit?: number; offset?: number; status?: string } = {}
    ) => {
      setLoadingHistory(true);
      setHistoryError(null);

      try {
        const params = new URLSearchParams();
        if (options.limit) params.append("limit", options.limit.toString());
        if (options.offset) params.append("offset", options.offset.toString());
        if (options.status) params.append("status", options.status);

        const response = await fetch(
          `/api/contracts/${contractId}/qr/history?${params}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Erro ao buscar histórico"
          );
        }

        const data = await response.json();
        setHistoryData(data);
        return data;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro desconhecido";
        setHistoryError(message);
        throw error;
      } finally {
        setLoadingHistory(false);
      }
    },
    []
  );

  // Utils
  const clearErrors = useCallback(() => {
    setGenerationError(null);
    setScanError(null);
    setHistoryError(null);
  }, []);

  const clearScanSuccess = useCallback(() => {
    setScanSuccess(null);
  }, []);

  return {
    generateQR,
    generatingQR,
    generationError,
    qrData,
    scanQR,
    scanning,
    scanError,
    scanSuccess,
    fetchHistory,
    loadingHistory,
    historyError,
    historyData,
    clearErrors,
    clearScanSuccess,
  };
}
