'use client';

/**
 * QR History Component
 * Displays presence confirmation history for a contract
 * Features: Pagination, filtering, status indicators, export
 */

import React, { useEffect, useState } from 'react';
import { useQRCode } from '@/hooks/useQRCode';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight,
  Hourglass,
} from 'lucide-react';

interface QRHistoryProps {
  contractId: string;
  caregiverName?: string;
}

export function QRHistory({ contractId, caregiverName }: QRHistoryProps) {
  const { fetchHistory, loadingHistory, historyError, historyData, clearErrors } =
    useQRCode();

  const [status, setStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [limit] = useState(10);

  // Load history on mount and when filters change
  useEffect(() => {
    loadHistoryData();
  }, [contractId, status, currentPage]);

  const loadHistoryData = async () => {
    try {
      clearErrors();
      await fetchHistory(contractId, {
        limit,
        offset: currentPage * limit,
        status: status === 'all' ? undefined : status,
      });
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const handleExportCSV = () => {
    if (!historyData?.history) return;

    const csv = [
      ['Data Gerada', 'Hora', 'Status', 'Profissional', 'Hora Confirmação'],
      ...historyData.history.map((item: any) => [
        new Date(item.generatedAt).toLocaleDateString('pt-PT'),
        new Date(item.generatedAt).toLocaleTimeString('pt-PT'),
        getStatusLabel(item.status),
        item.scannedBy?.name || '-',
        item.scannedAt
          ? new Date(item.scannedAt).toLocaleTimeString('pt-PT')
          : '-',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `qr-history-${contractId}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendente';
      case 'expired':
        return 'Expirada';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'expired':
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const totalPages = Math.ceil((historyData?.total || 0) / limit);
  const canGoNext = currentPage < totalPages - 1;
  const canGoPrev = currentPage > 0;

  return (
    <div className="w-full space-y-4">
      {/* Error Alert */}
      {historyError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{historyError}</AlertDescription>
        </Alert>
      )}

      {/* History Card */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">
                Histórico de Confirmações
              </h3>
              <p className="text-sm text-gray-600">
                {historyData?.total || 0} confirmações no total
              </p>
            </div>

            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              disabled={!historyData?.history?.length}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="confirmed">Confirmadas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="expired">Expiradas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loadingHistory ? (
            <div className="py-12 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
              <p className="text-gray-600">A carregar histórico...</p>
            </div>
          ) : historyData?.history && historyData.history.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Data Gerada
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Profissional
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Hora Confirmação
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.history.map((item: any) => (
                      <tr key={item.qrCodeId} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(item.status)}
                            <span className="text-xs font-medium">
                              {getStatusLabel(item.status)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-gray-900">
                              {new Date(item.generatedAt).toLocaleDateString('pt-PT')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(item.generatedAt).toLocaleTimeString('pt-PT')}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {item.scannedBy ? (
                            <span className="text-gray-900">{item.scannedBy.name}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.scannedAt ? (
                            new Date(item.scannedAt).toLocaleTimeString('pt-PT')
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {historyData.history.map((item: any) => (
                  <div
                    key={item.qrCodeId}
                    className="border border-gray-200 rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className="text-xs font-medium">
                          {getStatusLabel(item.status)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(item.generatedAt).toLocaleDateString('pt-PT')}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-gray-900">
                      {item.scannedBy ? item.scannedBy.name : '-'}
                    </p>

                    <p className="text-xs text-gray-500">
                      {item.scannedAt
                        ? `Confirmado em ${new Date(item.scannedAt).toLocaleTimeString('pt-PT')}`
                        : 'Pendente ou expirado'}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    Página {currentPage + 1} de {totalPages}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!canGoPrev}
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!canGoNext}
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="py-12 text-center">
              <Hourglass className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">Nenhuma confirmação ainda</p>
              <p className="text-sm text-gray-500">
                {status === 'all'
                  ? 'Quando o profissional escanear um código QR, aparecerá aqui.'
                  : 'Nenhuma confirmação com o status selecionado.'}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
