"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  IconShield, 
  IconCheck, 
  IconX, 
  IconLoader2, 
  IconClock,
  IconCamera,
  IconId,
  IconSun,
  IconRefresh,
  IconArrowRight,
  IconAlertCircle
} from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

interface KycStatus {
  verification_status: VerificationStatus;
  session_id?: string;
  session_created_at?: string;
  completed_at?: string;
  widget_url?: string;
  confidence?: number;
}

function KycPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { t } = useI18n();

  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showWidget, setShowWidget] = useState(false);
  const [widgetUrl, setWidgetUrl] = useState("");

  const isCaregiver = session?.user?.role === "CAREGIVER";
  const isFamily = session?.user?.role === "FAMILY";
  const canAccessKyc = isCaregiver || isFamily;

  // Fetch KYC status on mount
  useEffect(() => {
    if (status === "authenticated" && canAccessKyc) {
      fetchKycStatus();
    }
  }, [status, canAccessKyc]);

  // Poll for status when widget is open
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showWidget && kycStatus?.verification_status === "PENDING") {
      interval = setInterval(() => {
        fetchKycStatus();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [showWidget, kycStatus?.verification_status]);

  // Check for success message from redirect
  useEffect(() => {
    const message = searchParams.get("message");
    if (message === "kyc_completed") {
      setSuccess(t.kyc.verifiedTitle);
    }
  }, [searchParams, t.kyc.verifiedTitle]);

  const fetchKycStatus = async () => {
    try {
      const response = await apiFetch("/api/kyc");
      if (response.ok) {
        const data = await response.json();
        setKycStatus(data);

        // If there's an existing widget URL for PENDING session, store it
        if (data.widget_url && data.verification_status === "PENDING") {
          setWidgetUrl(data.widget_url);
        }

        // If verified while widget is open, close it
        if (data.verification_status === "VERIFIED" && showWidget) {
          setShowWidget(false);
          setSuccess(t.kyc.verifiedTitle);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || t.kyc.error);
      }
    } catch (err) {
      console.error("Error fetching KYC status:", err);
      setError(t.kyc.error);
    } finally {
      setIsLoading(false);
    }
  };

  const startVerification = async () => {
    setIsStarting(true);
    setError("");

    try {
      const response = await apiFetch("/api/kyc", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.kyc.error);
      }

      // Open widget in modal
      if (data.url) {
        setWidgetUrl(data.url);
        setShowWidget(true);
        setKycStatus(prev => prev ? { ...prev, verification_status: "PENDING" } : null);
        // Start polling for status
        setTimeout(() => fetchKycStatus(), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.kyc.error);
    } finally {
      setIsStarting(false);
    }
  };

  const closeWidget = useCallback(() => {
    setShowWidget(false);
    fetchKycStatus();
  }, []);

  const handleContinue = () => {
    router.push("/app/dashboard");
  };

  // Loading state
  if (status === "loading" || isLoading) {
    return (
      <AppShell>
        <div className="space-y-3 p-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </AppShell>
    );
  }

  // Only authenticated FAMILY or CAREGIVER users can access KYC
  if (!canAccessKyc) {
    return (
      <AppShell>
        <div className="flex items-center justify-center p-8">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <>
      {/* Widget Modal */}
      {showWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex items-center gap-2">
                <IconShield className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">{t.kyc.title}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={closeWidget}
                className="h-7 w-7"
              >
                <IconX className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Widget Container */}
            <div className="relative" style={{ height: "500px" }}>
              <iframe
                src={widgetUrl}
                className="w-full h-full border-0"
                allow="camera; microphone; geolocation"
                title="Didit Verification"
              />
            </div>
            
            {/* Modal Footer */}
            <div className="p-3 border-t bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">
                {t.kyc.inProgressDesc}
              </p>
            </div>
          </div>
        </div>
      )}

      <AppShell>
        <div className="space-y-3">
          {/* Header compacto */}
          <div className="flex items-center justify-between px-4 py-3 bg-background sticky top-0 z-10 border-b">
            <h1 className="text-lg font-semibold">{t.kyc.title}</h1>
            {kycStatus?.verification_status === "VERIFIED" && (
              <Button size="sm" onClick={handleContinue}>
                {t.nav.dashboard}
                <IconArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive" className="mx-4">
              <IconAlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mx-4 border-green-500/20 bg-green-500/5">
              <IconCheck className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}

          {/* Status Card - compacto */}
          <div className="px-4">
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-col items-center text-center">
                  {/* Status Icon */}
                  <div className="mb-2">
                    {kycStatus?.verification_status === "VERIFIED" && (
                      <div className="p-3 bg-green-500/10 rounded-full">
                        <IconCheck className="h-8 w-8 text-green-500" />
                      </div>
                    )}
                    {kycStatus?.verification_status === "PENDING" && (
                      <div className="p-3 bg-yellow-500/10 rounded-full">
                        <IconClock className="h-8 w-8 text-yellow-500" />
                      </div>
                    )}
                    {kycStatus?.verification_status === "REJECTED" && (
                      <div className="p-3 bg-destructive/10 rounded-full">
                        <IconX className="h-8 w-8 text-destructive" />
                      </div>
                    )}
                    {kycStatus?.verification_status === "UNVERIFIED" && (
                      <div className="p-3 bg-muted rounded-full">
                        <IconShield className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <Badge 
                    variant={
                      kycStatus?.verification_status === "VERIFIED" ? "default" :
                      kycStatus?.verification_status === "PENDING" ? "secondary" :
                      kycStatus?.verification_status === "REJECTED" ? "destructive" : "outline"
                    }
                    className={kycStatus?.verification_status === "VERIFIED" ? "bg-green-500" : ""}
                  >
                    {kycStatus?.verification_status === "VERIFIED" && t.kyc.status.verified}
                    {kycStatus?.verification_status === "PENDING" && t.kyc.status.pending}
                    {kycStatus?.verification_status === "REJECTED" && t.kyc.status.rejected}
                    {kycStatus?.verification_status === "UNVERIFIED" && t.kyc.status.unverified}
                  </Badge>

                  {/* Status-specific content */}
                  <div className="mt-3 w-full">
                    {kycStatus?.verification_status === "VERIFIED" && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-green-600">{t.kyc.verifiedTitle}</p>
                        <p className="text-xs text-muted-foreground">{t.kyc.verifiedDesc}</p>
                        {kycStatus.completed_at && (
                          <p className="text-[10px] text-muted-foreground">
                            {t.kyc.completedAt}: {new Date(kycStatus.completed_at).toLocaleDateString('pt-PT')}
                          </p>
                        )}
                      </div>
                    )}

                    {kycStatus?.verification_status === "PENDING" && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-yellow-600">{t.kyc.inProgress}</p>
                        <p className="text-xs text-muted-foreground">{t.kyc.inProgressDesc}</p>
                        <div className="flex gap-2 justify-center">
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={fetchKycStatus}
                          >
                            <IconRefresh className="h-3.5 w-3.5 mr-1" />
                            {t.kyc.refreshStatus || "Atualizar"}
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => widgetUrl ? setShowWidget(true) : startVerification()}
                          >
                            {t.kyc.continueVerification || "Continuar"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {kycStatus?.verification_status === "REJECTED" && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-destructive">{t.kyc.rejectedTitle}</p>
                        <p className="text-xs text-muted-foreground">{t.kyc.rejectedDesc}</p>
                        <Button 
                          size="sm"
                          onClick={startVerification}
                          disabled={isStarting}
                        >
                          {isStarting ? <IconLoader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
                          {t.kyc.startNewVerification}
                        </Button>
                      </div>
                    )}

                    {kycStatus?.verification_status === "UNVERIFIED" && (
                      <div className="space-y-3 mt-2">
                        <p className="text-xs text-muted-foreground">{t.kyc.description}</p>
                        <Button 
                          size="sm"
                          onClick={startVerification}
                          disabled={isStarting}
                        >
                          {isStarting ? (
                            <>
                              <IconLoader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              {t.kyc.processing}
                            </>
                          ) : (
                            <>
                              <IconShield className="h-3.5 w-3.5 mr-1" />
                              {t.kyc.startVerification}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Requirements - compacto */}
          <div className="px-4">
            <Card>
              <CardContent className="py-3">
                <p className="text-xs font-medium mb-2">{t.kyc.requirements.title}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded">
                      <IconId className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">{t.kyc.requirements.item1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded">
                      <IconCamera className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">{t.kyc.requirements.item2}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded">
                      <IconSun className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">{t.kyc.requirements.item3}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benefits - compacto */}
          <div className="px-4 pb-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-3">
                <p className="text-xs font-medium mb-2">{t.kyc.benefits.title}</p>
                <ul className="space-y-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <li key={i} className="flex items-start gap-2">
                      <IconCheck className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        {t.kyc.benefits[`item${i}` as keyof typeof t.kyc.benefits]}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    </>
  );
}

export default function KycPage() {
  const { t } = useI18n();
  
  return (
    <Suspense fallback={
      <AppShell>
        <div className="space-y-3 p-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </AppShell>
    }>
      <KycPageContent />
    </Suspense>
  );
}
