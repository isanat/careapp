"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  IconLogo, 
  IconShield, 
  IconCheck, 
  IconX, 
  IconLoader2, 
  IconClock,
  IconCamera,
  IconId,
  IconSun,
  IconArrowRight
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
}

function KycPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const userId = searchParams.get("userId");
  const { t } = useI18n();

  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");
  const [showWidget, setShowWidget] = useState(false);
  const [widgetUrl, setWidgetUrl] = useState("");
  const [widgetSessionToken, setWidgetSessionToken] = useState("");

  useEffect(() => {
    // If not logged in and no userId, redirect to register
    if (status === "unauthenticated" && !userId) {
      router.push("/auth/register");
    }
  }, [status, userId, router]);

  useEffect(() => {
    if (status === "authenticated" || userId) {
      fetchKycStatus();
    }
  }, [status, userId]);

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

  const fetchKycStatus = async () => {
    try {
      const response = await fetch("/api/kyc");
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
        }

        // If already verified, redirect to payment
        if (data.verification_status === "VERIFIED") {
          setTimeout(() => {
            router.push(`/auth/payment?userId=${userId || session?.user?.id}`);
          }, 1500);
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
      const response = await fetch("/api/kyc", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.kyc.error);
      }

      // Open widget in modal instead of new tab
      if (data.url) {
        setWidgetUrl(data.url);
        setWidgetSessionToken(data.session_token || "");
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
    if (kycStatus?.verification_status === "VERIFIED") {
      router.push(`/auth/payment?userId=${userId || session?.user?.id}`);
    }
  };

  const getStatusBadge = () => {
    switch (kycStatus?.verification_status) {
      case "VERIFIED":
        return <Badge className="bg-green-500">{t.kyc.status.verified}</Badge>;
      case "PENDING":
        return <Badge variant="secondary">{t.kyc.status.pending}</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">{t.kyc.status.rejected}</Badge>;
      default:
        return <Badge variant="outline">{t.kyc.status.unverified}</Badge>;
    }
  };

  const getStatusIcon = () => {
    switch (kycStatus?.verification_status) {
      case "VERIFIED":
        return <IconCheck className="h-16 w-16 text-green-500" />;
      case "PENDING":
        return <IconClock className="h-16 w-16 text-yellow-500" />;
      case "REJECTED":
        return <IconX className="h-16 w-16 text-destructive" />;
      default:
        return <IconShield className="h-16 w-16 text-muted-foreground" />;
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardContent className="py-12 text-center">
            <IconLoader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">{t.kyc.checkingStatus}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <>
      {/* Widget Modal */}
      {showWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex items-center gap-2">
                <IconShield className="h-5 w-5 text-primary" />
                <span className="font-semibold">Verificação de Identidade</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={closeWidget}
                className="h-8 w-8"
              >
                <IconX className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Widget Container */}
            <div className="relative" style={{ height: "600px" }}>
              <iframe
                src={widgetUrl}
                className="w-full h-full border-0"
                allow="camera; microphone; geolocation"
                title="Didit Verification"
              />
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50 text-center">
              <p className="text-sm text-muted-foreground">
                Sua verificação está sendo processada. Aguarde a confirmação.
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center space-y-4">
            <Link href="/" className="inline-flex items-center justify-center gap-2 mx-auto">
              <IconLogo className="h-10 w-10 text-primary" />
            </Link>
            <div>
              <CardTitle className="text-2xl">{t.kyc.title} - {APP_NAME}</CardTitle>
              <CardDescription>{t.kyc.description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                <IconX className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Status Card */}
            <div className="flex flex-col items-center text-center py-4">
              {getStatusIcon()}
              <div className="mt-4 mb-2">{getStatusBadge()}</div>
              
              {kycStatus?.verification_status === "VERIFIED" && (
                <>
                  <h2 className="text-xl font-semibold text-green-600 mt-2">
                    {t.kyc.verifiedTitle}
                  </h2>
                  <p className="text-muted-foreground mt-1">{t.kyc.verifiedDesc}</p>
                  {kycStatus.completed_at && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {t.kyc.completedAt}: {new Date(kycStatus.completed_at).toLocaleDateString()}
                    </p>
                  )}
                </>
              )}

              {kycStatus?.verification_status === "PENDING" && (
                <>
                  <h2 className="text-xl font-semibold text-yellow-600 mt-2">
                    {t.kyc.inProgress}
                  </h2>
                  <p className="text-muted-foreground mt-1">{t.kyc.inProgressDesc}</p>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={fetchKycStatus}
                      variant="outline"
                    >
                      <IconRefresh className="h-4 w-4 mr-2" />
                      Atualizar Status
                    </Button>
                    <Button 
                      onClick={() => {
                        if (widgetUrl) {
                          setShowWidget(true);
                        } else {
                          startVerification();
                        }
                      }}
                      variant="default"
                    >
                      Continuar Verificação
                    </Button>
                  </div>
                </>
              )}

              {kycStatus?.verification_status === "REJECTED" && (
                <>
                  <h2 className="text-xl font-semibold text-destructive mt-2">
                    {t.kyc.rejectedTitle}
                  </h2>
                  <p className="text-muted-foreground mt-1">{t.kyc.rejectedDesc}</p>
                  <Button 
                    className="mt-4" 
                    onClick={startVerification}
                    disabled={isStarting}
                  >
                    {isStarting ? t.kyc.processing : t.kyc.startNewVerification}
                  </Button>
                </>
              )}

              {kycStatus?.verification_status === "UNVERIFIED" && (
                <Button 
                  className="mt-4" 
                  onClick={startVerification}
                  disabled={isStarting}
                  size="lg"
                >
                  {isStarting ? (
                    <>
                      <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t.kyc.processing}
                    </>
                  ) : (
                    <>
                      <IconShield className="h-4 w-4 mr-2" />
                      {t.kyc.startVerification}
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Requirements */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t.kyc.requirements.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <IconId className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm">{t.kyc.requirements.item1}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <IconCamera className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm">{t.kyc.requirements.item2}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <IconSun className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm">{t.kyc.requirements.item3}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <p className="font-medium text-sm mb-3">{t.kyc.benefits.title}</p>
                <ul className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <IconCheck className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{t.kyc.benefits[`item${i}` as keyof typeof t.kyc.benefits]}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Continue Button (only when verified) */}
            {kycStatus?.verification_status === "VERIFIED" && (
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleContinue}
              >
                {t.payment.title}
                <IconArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}

// Add missing import
function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

export default function KycPage() {
  const { t } = useI18n();
  
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardContent className="py-12 text-center">
            <p>{t.loading}</p>
          </CardContent>
        </Card>
      </main>
    }>
      <KycPageContent />
    </Suspense>
  );
}
