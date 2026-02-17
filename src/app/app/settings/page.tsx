"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSelector } from "@/components/ui/language-selector";
import { 
  IconUser, 
  IconPhone,
  IconWallet,
  IconLogout,
  IconExternalLink,
  IconCopy,
  IconCheck,
  IconLoader2,
  IconShield,
  IconAlert
} from "@/components/icons";
import { APP_NAME, TOKEN_SYMBOL } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
}

interface UserWallet {
  address: string;
  balanceTokens: number;
}

interface KycStatus {
  verification_status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  session_id?: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setWallet(data.wallet);
        setName(data.user.name || "");
      }
      
      // Fetch KYC status for caregivers
      if (profile?.role === "CAREGIVER" || session?.user?.role === "CAREGIVER") {
        const kycResponse = await fetch("/api/kyc");
        if (kycResponse.ok) {
          const kycData = await kycResponse.json();
          setKycStatus(kycData);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const copyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  const isFamily = profile?.role === "FAMILY";

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">{t.settings.title}</h1>
          <p className="text-muted-foreground">
            {t.settings.account}
          </p>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t.settings.profile}</CardTitle>
            <CardDescription>{t.settings.account}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {profile?.name?.split(" ").map((n) => n[0]).join("") || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{profile?.name}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <Badge variant="secondary" className="mt-1">
                  {isFamily ? t.auth.family : t.auth.caregiver}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t.auth.name}</Label>
                <Input 
                  id="name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.auth.name}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t.auth.email}</Label>
                  <Input id="email" type="email" value={profile?.email || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t.auth.phone}</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+351 912 345 678" 
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.loading}
                  </>
                ) : (
                  t.settings.saveChanges
                )}
              </Button>
              {saveSuccess && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <IconCheck className="h-4 w-4" />
                  {t.settings.saved}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Wallet Section */}
        {wallet && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconWallet className="h-5 w-5" />
                {t.wallet.title}
              </CardTitle>
              <CardDescription>{TOKEN_SYMBOL}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Address</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-background px-2 py-1 rounded">
                      {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                    </code>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyAddress}>
                      {copied ? <IconCheck className="h-4 w-4 text-green-500" /> : <IconCopy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t.wallet.balance}</span>
                  <span className="font-medium">{wallet.balanceTokens.toLocaleString()} {TOKEN_SYMBOL}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="/app/wallet">
                    {t.wallet.title}
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <a 
                    href={`https://polygonscan.com/address/${wallet.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <IconExternalLink className="h-4 w-4" />
                    Blockchain
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>{t.settings.theme}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t.theme.light}/{t.theme.dark}</p>
                <p className="text-sm text-muted-foreground">{t.theme.system}</p>
              </div>
              <ThemeToggle />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t.language.select}</p>
                <p className="text-sm text-muted-foreground">PT, EN, ES</p>
              </div>
              <LanguageSelector />
            </div>
          </CardContent>
        </Card>

        {/* KYC Verification - Only for Caregivers */}
        {isCaregiver && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconShield className="h-5 w-5" />
                {t.kyc.title}
              </CardTitle>
              <CardDescription>{t.kyc.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t.profile.verification}</p>
                  <p className="text-sm text-muted-foreground">
                    {kycStatus?.verification_status === "VERIFIED" 
                      ? t.kyc.status.verified 
                      : kycStatus?.verification_status === "PENDING"
                      ? t.kyc.status.pending
                      : kycStatus?.verification_status === "REJECTED"
                      ? t.kyc.status.rejected
                      : t.kyc.status.unverified}
                  </p>
                </div>
                <Badge 
                  variant={
                    kycStatus?.verification_status === "VERIFIED" 
                      ? "default" 
                      : kycStatus?.verification_status === "PENDING"
                      ? "secondary"
                      : kycStatus?.verification_status === "REJECTED"
                      ? "destructive"
                      : "outline"
                  }
                  className={
                    kycStatus?.verification_status === "VERIFIED" 
                      ? "bg-green-500" 
                      : ""
                  }
                >
                  {kycStatus?.verification_status === "VERIFIED" && (
                    <IconCheck className="h-3 w-3 mr-1" />
                  )}
                  {kycStatus?.verification_status === "VERIFIED" 
                    ? t.kyc.status.verified 
                    : kycStatus?.verification_status === "PENDING"
                    ? t.kyc.status.pending
                    : kycStatus?.verification_status === "REJECTED"
                    ? t.kyc.status.rejected
                    : t.kyc.status.unverified}
                </Badge>
              </div>
              
              {kycStatus?.verification_status !== "VERIFIED" && (
                <Button asChild className="w-full">
                  <Link href="/app/verify">
                    <IconShield className="h-4 w-4 mr-2" />
                    {kycStatus?.verification_status === "REJECTED" 
                      ? t.kyc.startNewVerification 
                      : t.kyc.startVerification}
                  </Link>
                </Button>
              )}
              
              {kycStatus?.verification_status === "VERIFIED" && (
                <div className="p-3 bg-green-500/10 text-green-700 rounded-lg text-sm flex items-center gap-2">
                  <IconCheck className="h-4 w-4" />
                  {t.kyc.verifiedDesc}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Logout */}
        <Card className="border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t.auth.logout}</p>
                <p className="text-sm text-muted-foreground">{APP_NAME}</p>
              </div>
              <Button 
                variant="destructive" 
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <IconLogout className="h-4 w-4 mr-2" />
                {t.auth.logout}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
