'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/common/page-header';
import { StatsCard } from '@/components/admin/common/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IconCoins,
  IconHeartHandshake,
  IconTrendingUp,
  IconRefresh,
  IconDownload,
} from '@/components/icons';

interface Metrics {
  periodDays: number;
  totalRevenue: number;
  totalDemandsCreated: number;
  avgConversionRate: number;
  avgTimeToFirstProposal: number;
  avgTicket: number;
}

interface ChartDataPoint {
  date: string;
  revenue: string;
}

interface DemandsSummary {
  byStatus: Record<string, number>;
  byVisibility: Record<string, number>;
}

export default function AdminDemandsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [summary, setSummary] = useState<DemandsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(7);

  const fetchMetrics = async (days: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/demands/metrics?period=${days}`);
      if (!res.ok) throw new Error('Failed to fetch metrics');
      const data = await res.json();
      setMetrics(data.metrics);
      setChartData(data.chartData);
      setSummary(data.demandsSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(period);
  }, [period]);

  const handleExportCSV = async () => {
    try {
      if (!metrics || !chartData) return;

      const rows = [
        ['Dashboard de Demandas - Relatório'],
        [`Período: Últimos ${period} dias`],
        [],
        ['MÉTRICAS GLOBAIS'],
        ['Receita Total', `€${metrics.totalRevenue.toFixed(2)}`],
        ['Demandas Criadas', metrics.totalDemandsCreated.toString()],
        ['Taxa Conversão Média', `${metrics.avgConversionRate.toFixed(2)}%`],
        ['Dias até 1ª Proposta (avg)', metrics.avgTimeToFirstProposal.toString()],
        ['Ticket Médio', `€${metrics.avgTicket.toFixed(2)}`],
        [],
        ['RECEITA DIÁRIA'],
        ['Data', 'Receita'],
        ...chartData.map(d => [d.date, `€${d.revenue}`]),
      ];

      const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `demands-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Erro ao exportar CSV');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace de Demandas"
        description="Gerenciamento e análise de demandas da plataforma"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchMetrics(period)} disabled={loading}>
              <IconRefresh className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={loading || !metrics}>
              <IconDownload className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        }
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Period Selector */}
      <div className="flex gap-2">
        {[7, 30, 90].map(days => (
          <Button
            key={days}
            variant={period === days ? 'default' : 'outline'}
            onClick={() => setPeriod(days)}
            disabled={loading}
          >
            {days === 7 && 'Últimos 7 dias'}
            {days === 30 && 'Últimos 30 dias'}
            {days === 90 && 'Últimos 90 dias'}
          </Button>
        ))}
      </div>

      {/* KPI Cards */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="Receita (Visibilidade)"
            value={formatCurrency(metrics.totalRevenue)}
            change={`período: ${period} dias`}
            trend="up"
            icon={<IconCoins className="h-6 w-6" />}
            loading={loading}
          />
          <StatsCard
            title="Demandas Criadas"
            value={metrics.totalDemandsCreated.toString()}
            change={`período: ${period} dias`}
            trend="up"
            icon={<IconHeartHandshake className="h-6 w-6" />}
            loading={loading}
          />
          <StatsCard
            title="Taxa Conversão (avg)"
            value={`${metrics.avgConversionRate.toFixed(2)}%`}
            change="demandas com boost vs sem"
            trend="neutral"
            icon={<IconTrendingUp className="h-6 w-6" />}
            loading={loading}
          />
          <StatsCard
            title="Dias até 1ª Proposta"
            value={metrics.avgTimeToFirstProposal.toString()}
            change="tempo médio"
            trend="down"
            icon={<IconRefresh className="h-6 w-6" />}
            loading={loading}
          />
          <StatsCard
            title="Ticket Médio"
            value={formatCurrency(metrics.avgTicket)}
            change="por boost"
            trend="neutral"
            icon={<IconCoins className="h-6 w-6" />}
            loading={loading}
          />
        </div>
      )}

      {/* Chart Section */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Receita Diária (Últimos {period} dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.map((point, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{point.date}</span>
                  <div className="flex items-center gap-4">
                    <div
                      className="h-2 bg-blue-500"
                      style={{
                        width: `${(parseFloat(point.revenue) / Math.max(...chartData.map(d => parseFloat(d.revenue))) * 200) || 2}px`,
                      }}
                    />
                    <span className="text-sm font-medium text-gray-900 w-16 text-right">
                      €{point.revenue}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demands Summary */}
      {summary && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* By Status */}
          <Card>
            <CardHeader>
              <CardTitle>Demandas por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(summary.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          status === 'ACTIVE'
                            ? 'default'
                            : status === 'CLOSED'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {status === 'ACTIVE' && '✓ Ativa'}
                        {status === 'CLOSED' && '✓ Fechada'}
                        {status === 'PAUSED' && '⏸ Pausada'}
                        {status === 'EXPIRED' && '✗ Expirada'}
                      </Badge>
                    </div>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* By Visibility */}
          <Card>
            <CardHeader>
              <CardTitle>Demandas por Visibilidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(summary.byVisibility)
                  .sort(([, a], [, b]) => b - a)
                  .map(([visibility, count]) => (
                    <div key={visibility} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            visibility === 'URGENT'
                              ? 'destructive'
                              : visibility === 'PREMIUM'
                              ? 'default'
                              : visibility === 'BASIC'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {visibility === 'URGENT' && '🔴 Urgente'}
                          {visibility === 'PREMIUM' && '⭐ Premium'}
                          {visibility === 'BASIC' && '✓ Basic'}
                          {visibility === 'NONE' && 'Normal'}
                        </Badge>
                      </div>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
