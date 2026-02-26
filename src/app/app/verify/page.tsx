"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";
import { 
  IconShield, 
  IconCheck, 
  IconX, 
  IconLoader2, 
  IconClock,
  IconCamera,
  IconId,
  IconSun
} from "@/components/icons";
import { useI18n } from "@/lib/i18n";

type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

interface KycStatus {
  verification_status: VerificationStatus;
  session_id?: string;
  session_created_at?: string;
  completed_at?: string;
  document_verified?: boolean;
}

export default function VerifyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();

  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchKycStatus();
    }
  }, [status]);

  const fetchKycStatus = async () => {
    try {
      const response = await fetch("/api/kyc");
      if (response.ok) {
        const data = await response.json();
        setKycStatus(data);
      } else {
        // If error, user might not be a caregiver
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

      // Redirect to Didit verification URL
      if (data.url) {
        window.open(data.url, "_blank");
        // Refresh status after a delay
        setTimeout(() => fetchKycStatus(), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.kyc.error);
    } finally {
      setIsStarting(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-6 max-w-2xl">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </AppShell>
    );
  }

  // All users (caregivers and families) need KYC verification

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

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">{t.kyc.title}</h1>
          <p className="text-muted-foreground">{t.kyc.description}</p>
        </div>

        {/* Status Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
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
                  {kycStatus.session_id && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {t.kyc.sessionId}: {kycStatus.session_id.slice(0, 8)}...
                    </p>
                  )}
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
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-4">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.kyc.benefits.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="flex items-start gap-3">
                  <IconCheck className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm">{t.kyc.benefits[`item${i}` as keyof typeof t.kyc.benefits]}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.kyc.requirements.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <IconId className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm">{t.kyc.requirements.item1}</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <IconCamera className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm">{t.kyc.requirements.item2}</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <IconSun className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm">{t.kyc.requirements.item3}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
