"use client";

import { useState } from "react";

export default function SyncDiditUserPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [adminKey, setAdminKey] = useState("");

  const [formData, setFormData] = useState({
    email: "netlinkassist@gmail.com",
    firstName: "Adriano",
    lastName: "Moreira da Silva",
    birthDate: "1976-05-01",
    nationality: "BRA",
    documentNumber: "01536294680",
    documentType: "driver_license",
    documentIssuer: "Detran-SP",
    documentIssueDate: "2000-05-26",
    documentExpiryDate: "2025-12-05",
    kycSessionId: "145187c2-56e1-4636-8efd-bf54713c11e2",
    role: "CAREGIVER",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSync = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/admin/sync-didit-user", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao sincronizar usuário");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(
        "Erro de conexão: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-background rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Sincronizar Usuário Didit
          </h1>
          <p className="text-muted-foreground mb-6">
            Use este formulário para criar ou atualizar um usuário com dados já
            aprovados no Didit
          </p>

          {/* Admin Key Warning */}
          <div className="mb-8 p-4 bg-primary/10 border border-primary/30 rounded-md">
            <p className="text-primary text-sm">
              <strong>⚠️ Chave de Admin Necessária:</strong> Você precisa da
              chave de admin para sincronizar usuários.
              <br />A chave está configurada em Vercel → Environment Variables →
              ADMIN_API_KEY
            </p>
          </div>

          {/* Admin Key */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chave de Admin
            </label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="dev-admin-key"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Em desenvolvimento, use "dev-admin-key"
            </p>
          </div>

          {/* Dados Pessoais */}
          <div className="border-t pt-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Dados Pessoais
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Primeiro Nome
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Sobrenome
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nacionalidade
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  placeholder="BRA, PT, etc"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="FAMILY">Family</option>
                  <option value="CAREGIVER">Caregiver</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dados do Documento */}
          <div className="border-t pt-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Dados do Documento
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tipo
                </label>
                <input
                  type="text"
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleInputChange}
                  placeholder="driver_license"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Número
                </label>
                <input
                  type="text"
                  name="documentNumber"
                  value={formData.documentNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Emissor
                </label>
                <input
                  type="text"
                  name="documentIssuer"
                  value={formData.documentIssuer}
                  onChange={handleInputChange}
                  placeholder="Detran-SP"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Data de Emissão
                </label>
                <input
                  type="date"
                  name="documentIssueDate"
                  value={formData.documentIssueDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Data de Expiração
                </label>
                <input
                  type="date"
                  name="documentExpiryDate"
                  value={formData.documentExpiryDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* KYC Session */}
          <div className="border-t pt-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Dados KYC
            </h2>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                KYC Session ID
              </label>
              <input
                type="text"
                name="kycSessionId"
                value={formData.kycSessionId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                ID da sessão do Didit
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleSync}
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-medium py-2 px-4 rounded-md transition"
            >
              {loading ? "Sincronizando..." : "Sincronizar Usuário"}
            </button>
          </div>

          {/* Result Messages */}
          {error && (
            <div className="mt-6 p-4 bg-destructive/10 border border-destructive/30 rounded-md">
              <p className="text-destructive">
                <strong>❌ Erro:</strong> {error}
              </p>
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 bg-success/10 border border-success/30 rounded-md">
              <p className="text-success mb-3">
                <strong>✅ Sucesso!</strong> Usuário sincronizado
              </p>
              <div className="text-sm text-success/90 space-y-1">
                <p>
                  <strong>User ID:</strong> {result.userId}
                </p>
                <p>
                  <strong>Email:</strong> {result.email}
                </p>
                <p>
                  <strong>Ação:</strong> {result.action}
                </p>
                <p>
                  <strong>Role:</strong> {formData.role}
                </p>
                <p>
                  <strong>Status:</strong> ACTIVE
                </p>
                <p>
                  <strong>KYC:</strong> VERIFIED
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
