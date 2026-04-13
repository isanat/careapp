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
  IconTrendingUp,
  IconClock,
  IconCheckCircle,
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

const statusColors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  PENDING: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30', icon: 'warning' },
  PROCESSING: { bg: 'bg-info/10', text: 'text-info', border: 'border-info/30', icon: 'info' },
  COMPLETED: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30', icon: 'success' },
  FAILED: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30', icon: 'destructive' },
  REFUNDED: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border/30', icon: 'muted' },
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

  // Calculate stats
  const stats = {
    total: payments.reduce((sum, p) => sum + p.amountEurCents, 0),
    pending: payments.filter(p => p.status === 'PENDING').length,
    completed: payments.filter(p => p.status === 'COMPLETED').length,
  };

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
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-tighter leading-none text-foreground mb-2">
            Gerenciar Pagamentos
          </h1>
          <p className="text-base text-muted-foreground font-medium">
            Aprovar ou rejeitar pagamentos pendentes
          </p>
        </div>

        {successMessage && (
          <div className="flex items-start gap-4 p-5 bg-success/5 border border-success/20 rounded-2xl animate-fade-in">
            <IconCheck className="h-5 w-5 text-success shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-display font-bold text-foreground text-sm">Sucesso</p>
              <p className="text-xs text-muted-foreground mt-1">{successMessage}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-4 p-5 bg-destructive/5 border border-destructive/20 rounded-2xl animate-fade-in">
            <IconAlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-display font-bold text-foreground text-sm">Erro</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Stat Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Revenue */}
          <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card hover:shadow-elevated hover:border-primary/30 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <IconEuro className="w-6 h-6 text-primary" />
            </div>
            <div className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest mb-1">
              Total Recebido
            </div>
            <div className="text-2xl sm:text-3xl font-display font-black tracking-tighter text-foreground mb-2">
              €{(stats.total / 100).toFixed(2)}
            </div>
            <div className="text-[9px] text-success font-medium flex items-center gap-1">
              <IconTrendingUp className="w-3 h-3" />
              De todas as transações
            </div>
          </div>

          {/* Pending */}
          <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card hover:shadow-elevated hover:border-warning/30 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <IconClock className="w-6 h-6 text-warning" />
            </div>
            <div className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest mb-1">
              Pendentes
            </div>
            <div className="text-2xl sm:text-3xl font-display font-black tracking-tighter text-foreground mb-2">
              {stats.pending}
            </div>
            <div className="text-[9px] text-warning font-medium">
              À espera de ação
            </div>
          </div>

          {/* Completed */}
          <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card hover:shadow-elevated hover:border-success/30 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <IconCheckCircle className="w-6 h-6 text-success" />
            </div>
            <div className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest mb-1">
              Aprovados
            </div>
            <div className="text-2xl sm:text-3xl font-display font-black tracking-tighter text-foreground mb-2">
              {stats.completed}
            </div>
            <div className="text-[9px] text-success font-medium">
              Transações completadas
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card hover:shadow-elevated hover:border-info/30 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-info/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <IconCheck className="w-6 h-6 text-info" />
            </div>
            <div className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest mb-1">
              Taxa de Sucesso
            </div>
            <div className="text-2xl sm:text-3xl font-display font-black tracking-tighter text-foreground mb-2">
              {payments.length > 0 ? Math.round((stats.completed / payments.length) * 100) : 0}%
            </div>
            <div className="text-[9px] text-info font-medium">
              De todas as transações
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-4">
          <h3 className="text-xs font-display font-bold text-foreground uppercase tracking-widest">
            Filtros
          </h3>
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none text-foreground cursor-pointer"
              >
                <option value="PENDING">Pendentes</option>
                <option value="COMPLETED">Aprovados</option>
                <option value="FAILED">Rejeitados</option>
                <option value="">Todos</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-sm">▾</div>
            </div>

            <div className="relative flex-1 min-w-[200px]">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none text-foreground cursor-pointer"
              >
                <option value="">Todos os Tipos</option>
                <option value="VISIBILITY_BOOST">Boosts de Visibilidade</option>
                <option value="CONTRACT_FEE">Taxas de Contrato</option>
                <option value="SERVICE_PAYMENT">Pagamento de Serviço</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-sm">▾</div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-3xl" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && payments.length === 0 && (
          <div className="text-center py-16 max-w-sm mx-auto">
            <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-5">
              <IconFileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h4 className="font-display font-bold text-foreground text-lg mb-2">
              Nenhum pagamento encontrado
            </h4>
            <p className="text-sm text-muted-foreground">
              Ajuste os filtros ou tente novamente mais tarde
            </p>
          </div>
        )}

        {/* Payments List */}
        {!isLoading && payments.length > 0 && (
          <section className="space-y-4">
            <h4 className="text-[10px] font-display font-black text-muted-foreground uppercase tracking-[0.4em] border-l-4 border-primary pl-4">
              Histórico de Pagamentos
            </h4>
            <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-card space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-secondary/40 rounded-2xl border border-border/50 hover:bg-secondary/60 transition-colors"
                >
                  {/* Left: User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <h4 className="text-sm font-display font-bold text-foreground truncate">
                          {payment.userName}
                        </h4>
                        <p className="text-[10px] font-display font-medium text-muted-foreground uppercase tracking-widest">
                          {payment.userEmail}
                        </p>
                      </div>
                    </div>
                    {payment.demandTitle && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium text-foreground">Demanda:</span> {payment.demandTitle}
                      </p>
                    )}
                    {payment.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {payment.description}
                      </p>
                    )}
                  </div>

                  {/* Middle: Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 text-[9px] font-display font-bold rounded-lg uppercase tracking-widest ${
                      statusColors[payment.status]?.bg || 'bg-muted'
                    } ${statusColors[payment.status]?.text || 'text-muted-foreground'}`}>
                      {statusLabels[payment.status] || payment.status}
                    </span>
                    <span className="px-3 py-1 text-[9px] font-display font-bold rounded-lg uppercase tracking-widest bg-primary/10 text-primary">
                      {typeLabels[payment.type] || payment.type}
                    </span>
                  </div>

                  {/* Right: Amount & Date */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-4 sm:gap-1 sm:text-right">
                    <div>
                      <p className="text-[10px] font-display font-bold text-muted-foreground/70 uppercase tracking-widest">
                        Valor
                      </p>
                      <p className="text-lg sm:text-xl font-display font-black text-foreground tracking-tighter">
                        €{(Number(payment.amountEurCents) / 100).toFixed(2)}
                      </p>
                    </div>
                    <p className="text-[9px] font-display font-bold text-muted-foreground uppercase tracking-widest">
                      {new Date(payment.createdAt).toLocaleDateString('pt-PT')}
                    </p>
                  </div>

                  {/* Actions */}
                  {payment.status === 'PENDING' && (
                    <div className="flex gap-2 sm:ml-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setRejectReason('');
                          setRejectDialogOpen(true);
                        }}
                        disabled={actionLoading !== null}
                        className="gap-2"
                      >
                        <IconX className="h-4 w-4" />
                        <span className="hidden sm:inline">Rejeitar</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setApproveDialogOpen(true);
                        }}
                        disabled={actionLoading !== null}
                        className="gap-2"
                      >
                        {actionLoading === payment.id ? (
                          <IconLoader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <IconCheck className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline">Aprovar</span>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Approve Dialog */}
        <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <DialogContent className="max-w-sm rounded-3xl border border-border bg-card">
            <DialogHeader>
              <DialogTitle className="text-lg font-display font-black text-foreground">
                Aprovar Pagamento?
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-2">
                <span className="font-medium text-foreground">{selectedPayment?.userName}</span> • €{selectedPayment ? (Number(selectedPayment.amountEurCents) / 100).toFixed(2) : '0.00'}
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 bg-secondary/40 rounded-2xl border border-border/50 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Tipo:</span>
                <span className="font-medium text-foreground">
                  {typeLabels[selectedPayment?.type || ''] ||
                    selectedPayment?.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Email:</span>
                <span className="text-xs text-foreground font-medium">{selectedPayment?.userEmail}</span>
              </div>
              {selectedPayment?.demandTitle && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Demanda:</span>
                  <span className="text-xs text-foreground font-medium">
                    {selectedPayment.demandTitle}
                  </span>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 flex-row">
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
                className="gap-2"
              >
                {actionLoading ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <IconCheck className="h-4 w-4" />
                )}
                Aprovar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="max-w-sm rounded-3xl border border-border bg-card">
            <DialogHeader>
              <DialogTitle className="text-lg font-display font-black text-foreground">
                Rejeitar Pagamento
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-2">
                <span className="font-medium text-foreground">{selectedPayment?.userName}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <label className="text-xs font-display font-bold text-foreground uppercase tracking-widest">
                Motivo da Rejeição
              </label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Descreva o motivo..."
                className="bg-secondary border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-destructive/20 focus:border-destructive transition-all resize-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <DialogFooter className="gap-2 flex-row">
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
                className="gap-2"
              >
                {actionLoading ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <IconX className="h-4 w-4" />
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
