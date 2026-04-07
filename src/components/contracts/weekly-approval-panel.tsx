"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

interface WeeklyApproval {
  id: string;
  weekNumber: number;
  amount: number;
  platformFee: number;
  caregiverReceives: number;
  approvalDueAt: string;
  familyDecision: string | null;
  status: string;
  approvedAt?: string;
  capturedAt?: string;
  familyNotes?: string;
  canApprove: boolean;
  canDispute: boolean;
}

interface WeeklyApprovalPanelProps {
  contractId: string;
  isFamily: boolean;
  weeklyApprovals?: WeeklyApproval[];
}

export function WeeklyApprovalPanel({
  contractId,
  isFamily,
  weeklyApprovals: initialApprovals,
}: WeeklyApprovalPanelProps) {
  const { data: session } = useSession();
  const [approvals, setApprovals] = useState<WeeklyApproval[]>(
    initialApprovals || []
  );
  const [loading, setLoading] = useState(!initialApprovals);
  const [approving, setApproving] = useState<number | null>(null);
  const [disputing, setDisputing] = useState<number | null>(null);
  const [disputeReason, setDisputeReason] = useState<Record<number, string>>({});
  const [showDisputeForm, setShowDisputeForm] = useState<Record<number, boolean>>(
    {}
  );

  // Fetch approvals if not provided
  useEffect(() => {
    if (!initialApprovals) {
      fetchApprovals();
    }
  }, [contractId, initialApprovals]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/contracts/${contractId}/weekly-approvals`);
      if (res.ok) {
        const data = await res.json();
        setApprovals(data.weeklyApprovals);
      }
    } catch (error) {
      console.error("Error fetching approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (weekNumber: number) => {
    try {
      setApproving(weekNumber);
      const res = await fetch(
        `/api/contracts/${contractId}/weekly-approvals/${weekNumber}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (res.ok) {
        // Refresh approvals
        await fetchApprovals();
        alert(`Semana ${weekNumber} aprovada com sucesso!`);
      } else {
        const error = await res.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      alert("Erro ao aprovar semana");
      console.error("Error approving:", error);
    } finally {
      setApproving(null);
    }
  };

  const handleDispute = async (weekNumber: number) => {
    const reason = disputeReason[weekNumber];
    if (!reason || reason.trim().length === 0) {
      alert("Por favor, forneça um motivo para a disputa");
      return;
    }

    try {
      setDisputing(weekNumber);
      const res = await fetch(
        `/api/contracts/${contractId}/weekly-approvals/${weekNumber}/dispute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        }
      );

      if (res.ok) {
        // Refresh approvals
        await fetchApprovals();
        setShowDisputeForm((prev) => ({ ...prev, [weekNumber]: false }));
        setDisputeReason((prev) => ({ ...prev, [weekNumber]: "" }));
        alert(`Disputa criada. Um administrador fará a mediação.`);
      } else {
        const error = await res.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      alert("Erro ao criar disputa");
      console.error("Error disputing:", error);
    } finally {
      setDisputing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "CAPTURED":
        return "bg-green-50 border-green-200";
      case "DISPUTED":
        return "bg-red-50 border-red-200";
      case "PENDING":
        return "bg-blue-50 border-blue-200";
      case "REFUNDED":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "CAPTURED":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "DISPUTED":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "PENDING":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "REFUNDED":
        return <XCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "CAPTURED":
        return "Aprovada";
      case "DISPUTED":
        return "Em Disputa";
      case "PENDING":
        return "Pendente";
      case "REFUNDED":
        return "Reembolsada";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-600">
          Nenhuma aprovação semanal configurada para este contrato.
        </p>
      </Card>
    );
  }

  // Calculate summary
  const pending = approvals.filter((a) => a.status === "PENDING").length;
  const approved = approvals.filter(
    (a) => a.status === "APPROVED" || a.status === "CAPTURED"
  ).length;
  const disputed = approvals.filter((a) => a.status === "DISPUTED").length;
  const totalAmount = approvals.reduce((sum, a) => sum + a.caregiverReceives, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="text-sm text-blue-700 font-medium">Pendentes</div>
          <div className="text-2xl font-bold text-blue-900">{pending}</div>
        </Card>
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="text-sm text-green-700 font-medium">Aprovadas</div>
          <div className="text-2xl font-bold text-green-900">{approved}</div>
        </Card>
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-sm text-red-700 font-medium">Em Disputa</div>
          <div className="text-2xl font-bold text-red-900">{disputed}</div>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="text-sm text-purple-700 font-medium">Total</div>
          <div className="text-2xl font-bold text-purple-900">
            €{(totalAmount / 100).toFixed(2)}
          </div>
        </Card>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Semanas de Trabalho</h3>

        {approvals.map((approval, index) => (
          <Card
            key={approval.id}
            className={`p-4 border-2 transition ${getStatusColor(approval.status)}`}
          >
            <div className="flex items-start justify-between">
              {/* Left: Week info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-800">
                    {approval.weekNumber}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">
                      Semana {approval.weekNumber}
                    </div>
                    <div className="text-sm text-gray-600">
                      Vencimento:{" "}
                      {formatDistanceToNow(new Date(approval.approvalDueAt), {
                        locale: pt,
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>

                {/* Amount breakdown */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <div className="text-gray-600">Valor</div>
                    <div className="font-semibold text-lg">
                      €{(approval.amount / 100).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Taxa Plataforma</div>
                    <div className="font-semibold">
                      -€{(approval.platformFee / 100).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Cuidador Recebe</div>
                    <div className="font-semibold text-green-700">
                      €{(approval.caregiverReceives / 100).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-2">
                  {getStatusIcon(approval.status)}
                  <Badge variant="secondary">{getStatusLabel(approval.status)}</Badge>
                  {approval.familyNotes && (
                    <span className="text-xs text-gray-600 italic">
                      "{approval.familyNotes}"
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              {isFamily && approval.canApprove && (
                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(approval.weekNumber)}
                    disabled={approving === approval.weekNumber}
                  >
                    {approving === approval.weekNumber ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Aprovando...
                      </>
                    ) : (
                      "✓ Aprovar"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() =>
                      setShowDisputeForm((prev) => ({
                        ...prev,
                        [approval.weekNumber]: !prev[approval.weekNumber],
                      }))
                    }
                  >
                    ✕ Disputar
                  </Button>
                </div>
              )}
            </div>

            {/* Dispute form */}
            {isFamily &&
              approval.canDispute &&
              showDisputeForm[approval.weekNumber] && (
                <div className="mt-4 p-4 bg-white border-t-2 border-orange-300">
                  <label className="text-sm font-medium">Motivo da disputa:</label>
                  <textarea
                    className="w-full mt-2 p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                    placeholder="Descreva por que está disputando este pagamento..."
                    value={disputeReason[approval.weekNumber] || ""}
                    onChange={(e) =>
                      setDisputeReason((prev) => ({
                        ...prev,
                        [approval.weekNumber]: e.target.value,
                      }))
                    }
                  />
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => handleDispute(approval.weekNumber)}
                      disabled={
                        disputing === approval.weekNumber ||
                        !disputeReason[approval.weekNumber]?.trim()
                      }
                    >
                      {disputing === approval.weekNumber ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Enviar Disputa"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setShowDisputeForm((prev) => ({
                          ...prev,
                          [approval.weekNumber]: false,
                        }))
                      }
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
          </Card>
        ))}
      </div>

      {/* Info box */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <div className="text-blue-600 mt-1">ℹ️</div>
          <div className="text-sm text-blue-900">
            <strong>Como funciona:</strong> Cada semana, você pode aprovar ou
            disputar o pagamento. Se não aprovar em 48-72 horas, o pagamento é
            aprovado automaticamente. Se disputar, um administrador mediará entre
            você e o cuidador.
          </div>
        </div>
      </Card>
    </div>
  );
}
