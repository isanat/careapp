/**
 * Exemplo de Integração: QR Code Feature
 *
 * Este arquivo mostra como integrar os componentes QR code
 * nas páginas existentes do aplicativo.
 *
 * IMPORTANTE: Este é apenas um exemplo educativo.
 * Para usar em produção, integra os componentes nas páginas reais:
 * - Family Dashboard: adiciona QRGenerator e QRHistory
 * - Caregiver App: adiciona QRScanner
 */

"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRGenerator, QRScanner, QRHistory } from "@/components/qr";

export default function ExemploIntegracaoQR() {
  const [selectedContractId] = useState("contract_exemplo_123");
  const [caregiverName] = useState("Maria Silva");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Exemplo de Integração - QR Code
          </h1>
          <p className="text-gray-600">
            Demonstração dos componentes de confirmação de presença via QR code
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="generator" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="generator">Gerar QR</TabsTrigger>
            <TabsTrigger value="scanner">Escanear QR</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          {/* QR Generator - Family */}
          <TabsContent value="generator" className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold mb-4">
                Gerador de QR - Dashboard Familiar
              </h2>
              <p className="text-gray-600 mb-6">
                Integrar este componente na página do contrato da família:
              </p>

              {/* Component */}
              <QRGenerator
                contractId={selectedContractId}
                caregiverName={caregiverName}
                onQRGenerated={(qrCode) => {
                  console.log("QR Gerado:", qrCode);
                }}
              />

              {/* Code Example */}
              <div className="mt-8 bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 font-mono text-sm">
                  {`import { QRGenerator } from '@/components/qr';

export default function FamilyDashboard() {
  return (
    <div>
      <h1>Contrato com João Silva</h1>
      <QRGenerator
        contractId="contract_123"
        caregiverName="João Silva"
        onQRGenerated={(qrCode) => {
          console.log('QR gerado:', qrCode);
        }}
      />
    </div>
  );
}`}
                </pre>
              </div>
            </div>
          </TabsContent>

          {/* QR Scanner - Caregiver */}
          <TabsContent value="scanner" className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold mb-4">
                Scanner de QR - App Profissional
              </h2>
              <p className="text-gray-600 mb-6">
                Integrar este componente em uma página dedicada da app do
                profissional:
              </p>

              {/* Component */}
              <QRScanner
                onScanSuccess={(result) => {
                  console.log("Presença confirmada:", result);
                }}
                onScanError={(error) => {
                  console.error("Erro ao escanear:", error);
                }}
              />

              {/* Code Example */}
              <div className="mt-8 bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 font-mono text-sm">
                  {`import { QRScanner } from '@/components/qr';

export default function CaregiverScanPage() {
  return (
    <div className="p-6">
      <h1>Confirmar Presença</h1>
      <QRScanner
        onScanSuccess={(result) => {
          // Mostrar mensagem de sucesso
          toast.success(result.message);
        }}
        onScanError={(error) => {
          // Mostrar erro
          toast.error(error);
        }}
      />
    </div>
  );
}`}
                </pre>
              </div>
            </div>
          </TabsContent>

          {/* QR History */}
          <TabsContent value="history" className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold mb-4">
                Histórico - Detalhes do Contrato
              </h2>
              <p className="text-gray-600 mb-6">
                Integrar este componente na página de detalhes do contrato:
              </p>

              {/* Component */}
              <QRHistory
                contractId={selectedContractId}
                caregiverName={caregiverName}
              />

              {/* Code Example */}
              <div className="mt-8 bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 font-mono text-sm">
                  {`import { QRHistory } from '@/components/qr';

export default function ContractDetailsPage({ contractId }) {
  return (
    <div>
      <h1>Detalhes do Contrato</h1>

      {/* Outras secções... */}

      {/* Histórico de Presença */}
      <section className="mt-8">
        <QRHistory contractId={contractId} />
      </section>
    </div>
  );
}`}
                </pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Integration Guide */}
        <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-2xl font-bold mb-4">Guia de Integração</h2>

          <div className="space-y-6">
            {/* Step 1 */}
            <div>
              <h3 className="text-lg font-semibold mb-2">
                1. Family Dashboard - Adicionar QRGenerator
              </h3>
              <p className="text-gray-600 mb-3">
                Localização:{" "}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  src/app/dashboard/contracts/[id]/page.tsx
                </code>
              </p>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                {`// Importar componente
import { QRGenerator } from '@/components/qr';

// Adicionar na secção de ações do contrato
<section className="mt-8">
  <QRGenerator
    contractId={contract.id}
    caregiverName={caregiver.name}
  />
</section>`}
              </pre>
            </div>

            {/* Step 2 */}
            <div>
              <h3 className="text-lg font-semibold mb-2">
                2. Family Dashboard - Adicionar QRHistory
              </h3>
              <p className="text-gray-600 mb-3">
                Localização: Mesma página acima
              </p>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                {`// Importar componente
import { QRHistory } from '@/components/qr';

// Adicionar após a secção do gerador
<section className="mt-8">
  <h2 className="text-xl font-bold mb-4">Histórico de Presença</h2>
  <QRHistory
    contractId={contract.id}
    caregiverName={caregiver.name}
  />
</section>`}
              </pre>
            </div>

            {/* Step 3 */}
            <div>
              <h3 className="text-lg font-semibold mb-2">
                3. Caregiver App - Adicionar QRScanner
              </h3>
              <p className="text-gray-600 mb-3">
                Localização:{" "}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  src/app/cuidador/scanner/page.tsx (nova página)
                </code>
              </p>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                {`import { QRScanner } from '@/components/qr';
import { useRouter } from 'next/navigation';

export default function CaregiverScannerPage() {
  const router = useRouter();

  return (
    <div className="container py-8">
      <QRScanner
        onScanSuccess={(result) => {
          // Mostrar sucesso e redirecionar
          toast.success(result.message);
          router.push('/cuidador/dashboard');
        }}
        onScanError={(error) => {
          toast.error(error);
        }}
      />
    </div>
  );
}`}
              </pre>
            </div>

            {/* Step 4 */}
            <div>
              <h3 className="text-lg font-semibold mb-2">
                4. Adicionar Botão de Navegação
              </h3>
              <p className="text-gray-600 mb-3">
                No menu do caregiver, adicionar link para scanner:
              </p>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                {`// No navbar/menu do caregiver
<Link
  href="/cuidador/scanner"
  className="flex items-center gap-2"
>
  <QrCode className="h-5 w-5" />
  Confirmar Presença
</Link>`}
              </pre>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3">
            ⚠️ Notas Importantes
          </h3>
          <ul className="space-y-2 text-blue-900 text-sm">
            <li>
              ✓ Os componentes usam <code>use client</code> (client-side
              rendering)
            </li>
            <li>
              ✓ O hook <code>useQRCode</code> gerencia todo o estado das
              operações
            </li>
            <li>✓ Os endpoints da API já estão implementados e prontos</li>
            <li>✓ A autenticação é validada no backend (NextAuth)</li>
            <li>✓ Rate limiting está ativado para evitar abuso</li>
            <li>✓ Responsivo em mobile, tablet e desktop</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
