'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AppShell } from '@/components/layout/app-shell';
import {
  IconCheck,
  IconX,
  IconLoader2,
  IconAlertCircle,
  IconEuro,
  IconFileText,
} from '@/components/icons';

interface Payment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: string;
  status: string;
  provider: string;
  amountEurCents: number;
  demandId?: string;
  demandTitle?: string;
  description: string;
  metadata?: string;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  VISIBILITY_BOOST: 'Boost de Visibilidade',
  CONTRACT_FEE: 'Taxa de Contrato',
  SERVICE_PAYMENT: 'Pagamento de Serviço',
  ACTIVATION: 'Ativação',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500',
  PROCESSING: 'bg-blue-500',
  COMPLETED: 'bg-green-500',
  FAILED: 'bg-red-500',
  REFUNDED: 'bg-gray-500',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  COMPLETED: 'Completo',
  FAILED: 'Falhou',
  REFUNDED: 'Reembolsado',
};

export default function AdminPaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('PENDING');

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/app/dashboard');
    } else if (status === 'authenticated') {
      fetchPayments();
    }
  }, [status, filterType, filterStatus]);

  const fetchPayments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterStatus) params.append('status', filterStatus);

      const response = await apiFetch(`/api/admin/payments?${params.toString()}`);
      if (!response.ok) throw new Error('Erro ao carregar pagamentos');

      const data = await response.json();
      setPayments(data.payments || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmApprove = async () => {
    if (!selectedPayment) return;
    setActionLoading(selectedPayment.id);
    try {
      const response = await apiFetch(
        `/api/admin/payments/${selectedPayment.id}/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) throw new Error('Erro ao aprovar pagamento');

      setSuccessMessage('Pagamento aprovado com sucesso!');
      setApproveDialogOpen(false);
      fetchPayments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const confirmReject = async () => {
    if (!selectedPayment || !rejectReason.trim()) {
      setError('Motivo da rejeição é obrigatório');
      return;
    }
    setActionLoading(selectedPayment.id);
    try {
      const response = await apiFetch(
        `/api/admin/payments/${selectedPayment.id}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: rejectReason }),
        }
      );

      if (!response.ok) throw new Error('Erro ao rejeitar pagamento');

      setSuccessMessage('Pagamento rejeitado.');
      setRejectDialogOpen(false);
      setRejectReason('');
      fetchPayments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <AppShell>
      <div className="space-y-3">
        {/* Header */}
        <div className="px-4 py-3 sticky top-0 z-10 bg-background border-b">
          <h1 className="text-lg font-semibold">Gerenciar Pagamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aprovar ou rejeitar pagamentos pendentes
          </p>
        </div>

        {successMessage && (
          <div className="mx-4 p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm flex items-center gap-2">
            <IconCheck className="h-4 w-4" />
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mx-4 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm flex items-center gap-2">
            <IconAlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="px-4 flex gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2 py-1 rounded border text-sm bg-background"
          >
            <option value="PENDING">Pendentes</option>
            <option value="COMPLETED">Aprovados</option>
            <option value="FAILED">Rejeitados</option>
            <option value="">Todos</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2 py-1 rounded border text-sm bg-background"
          >
            <option value="">Todos os Tipos</option>
            <option value="VISIBILITY_BOOST">Boosts de Visibilidade</option>
            <option value="CONTRACT_FEE">Taxas de Contrato</option>
            <option value="SERVICE_PAYMENT">Pagamento de Serviço</option>
          </select>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="px-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && payments.length === 0 && (
          <div className="px-4 py-12 text-center">
            <IconFileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhum pagamento encontrado
            </p>
          </div>
        )}

        {/* Payments List */}
        {!isLoading && payments.length > 0 && (
          <div className="px-4 space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">
                        {payment.userName}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {typeLabels[payment.type] || payment.type}
                      </Badge>
                      <Badge
                        className={`text-xs text-white ${
                          statusColors[payment.status] || 'bg-gray-500'
                        }`}
                      >
                        {statusLabels[payment.status] || payment.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {payment.userEmail}
                    </p>
                    {payment.description && (
                      <p className="text-xs text-muted-foreground">
                        {payment.description}
                      </p>
                    )}
                    {payment.demandTitle && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Demanda: <strong>{payment.demandTitle}</strong>
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="flex items-baseline gap-1 justify-end mb-2">
                      <span className="text-lg font-bold">€</span>
                      <span className="text-xl font-semibold">
                        {(Number(payment.amountEurCents) / 100).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {payment.status === 'PENDING' && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setRejectReason('');
                        setRejectDialogOpen(true);
                      }}
                      disabled={actionLoading !== null}
                      className="flex-1"
                    >
                      <IconX className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setApproveDialogOpen(true);
                      }}
                      disabled={actionLoading !== null}
                      className="flex-1"
                    >
                      {actionLoading === payment.id ? (
                        <IconLoader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <IconCheck className="h-4 w-4 mr-1" />
                      )}
                      Aprovar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Approve Dialog */}
        <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base">Aprovar Pagamento?</DialogTitle>
              <DialogDescription className="text-sm">
                {selectedPayment?.userName} -- €
                {selectedPayment ? (Number(selectedPayment.amountEurCents) / 100).toFixed(2) : '0.00'}
              </DialogDescription>
            </DialogHeader>
            <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <span>
                  {typeLabels[selectedPayment?.type || ''] ||
                    selectedPayment?.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="text-xs">{selectedPayment?.userEmail}</span>
              </div>
              {selectedPayment?.demandTitle && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Demanda:</span>
                  <span className="text-xs">
                    {selectedPayment.demandTitle}
                  </span>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApproveDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={confirmApprove}
                disabled={actionLoading !== null}
              >
                {actionLoading ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <IconCheck className="h-4 w-4 mr-1" />
                )}
                Aprovar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base">Rejeitar Pagamento</DialogTitle>
              <DialogDescription className="text-sm">
                {selectedPayment?.userName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Motivo da rejeição..."
                className="text-sm"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={confirmReject}
                disabled={!rejectReason.trim() || actionLoading !== null}
              >
                {actionLoading ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <IconX className="h-4 w-4 mr-1" />
                )}
                Rejeitar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
