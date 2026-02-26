"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconFileSearch,
  IconRefresh,
  IconUser,
  IconShield,
  IconCreditCard,
  IconCoin,
  IconFileText,
  IconExternalLink,
} from "@/components/icons";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface AuditLog {
  id: string;
  adminUserId: string;
  adminName: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
  reason: string | null;
  createdAt: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "50");
      if (actionFilter !== "all") params.set("action", actionFilter);
      if (entityFilter !== "all") params.set("entityType", entityFilter);

      const response = await fetch(`/api/admin/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityFilter]);

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-700";
      case "UPDATE":
        return "bg-blue-100 text-blue-700";
      case "DELETE":
        return "bg-red-100 text-red-700";
      case "SUSPEND":
        return "bg-amber-100 text-amber-700";
      case "ACTIVATE":
        return "bg-green-100 text-green-700";
      case "VERIFY_KYC":
        return "bg-cyan-100 text-cyan-700";
      case "REFUND":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "USER":
        return <IconUser className="h-4 w-4" />;
      case "PAYMENT":
        return <IconCreditCard className="h-4 w-4" />;
      case "CONTRACT":
        return <IconFileText className="h-4 w-4" />;
      case "TOKEN":
        return <IconCoin className="h-4 w-4" />;
      default:
        return <IconShield className="h-4 w-4" />;
    }
  };

  const parseJsonSafely = (str: string | null) => {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logs de Auditoria"
        description="Histórico de todas as ações administrativas"
        actions={
          <Button variant="outline" onClick={fetchLogs}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ações</SelectItem>
                <SelectItem value="CREATE">Criar</SelectItem>
                <SelectItem value="UPDATE">Atualizar</SelectItem>
                <SelectItem value="DELETE">Excluir</SelectItem>
                <SelectItem value="SUSPEND">Suspender</SelectItem>
                <SelectItem value="ACTIVATE">Ativar</SelectItem>
                <SelectItem value="VERIFY_KYC">Verificar KYC</SelectItem>
                <SelectItem value="REFUND">Reembolsar</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Entidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Entidades</SelectItem>
                <SelectItem value="USER">Usuário</SelectItem>
                <SelectItem value="CONTRACT">Contrato</SelectItem>
                <SelectItem value="PAYMENT">Pagamento</SelectItem>
                <SelectItem value="TOKEN">Token</SelectItem>
                <SelectItem value="CAREGIVER">Cuidador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Data/Hora</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Admin</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Ação</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Entidade</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">IP</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Nenhum log encontrado
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-sm">
                        {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: pt })}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-sm">{log.adminName}</p>
                          <p className="text-xs text-slate-500">{log.adminEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getEntityIcon(log.entityType)}
                          <span className="text-sm">{log.entityType}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">
                        {log.entityId ? `${log.entityId.slice(0, 8)}...` : "-"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {log.ipAddress || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate">
                        {log.reason || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Mostrando {logs.length} de {total} logs
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={logs.length < 50}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
