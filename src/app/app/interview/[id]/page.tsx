"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { AppShell } from "@/components/layout/app-shell";
import { 
  IconVideo, 
  IconClock, 
  IconCheck, 
  IconX, 
  IconLoader2,
  IconStar,
  IconAlertCircle
} from "@/components/icons";
import { useI18n } from "@/lib/i18n";

interface Interview {
  id: string;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  videoRoomUrl: string;
  familyName: string;
  caregiverName: string;
  familyUserId: string;
  caregiverUserId: string;
  questionnaire: {
    communicationRating?: number;
    experienceRating?: number;
    punctualityRating?: number;
    wouldRecommend?: boolean;
    proceedWithContract?: boolean;
    notes?: string;
  } | null;
  familyCompletedAt?: string;
}

export default function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Questionnaire state
  const [communicationRating, setCommunicationRating] = useState(3);
  const [experienceRating, setExperienceRating] = useState(3);
  const [punctualityRating, setPunctualityRating] = useState(3);
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [proceedWithContract, setProceedWithContract] = useState(false);
  const [notes, setNotes] = useState("");
  
  const paramsRef = useRef(params);

  useEffect(() => {
    const loadInterview = async () => {
      const resolvedParams = await paramsRef.current;
      try {
        const response = await fetch(`/api/interviews/${resolvedParams.id}`);
        if (response.ok) {
          const data = await response.json();
          setInterview(data.interview);
          
          // Pre-fill questionnaire if exists
          if (data.interview.questionnaire) {
            setCommunicationRating(data.interview.questionnaire.communicationRating || 3);
            setExperienceRating(data.interview.questionnaire.experienceRating || 3);
            setPunctualityRating(data.interview.questionnaire.punctualityRating || 3);
            setWouldRecommend(data.interview.questionnaire.wouldRecommend ?? true);
            setProceedWithContract(data.interview.questionnaire.proceedWithContract ?? false);
            setNotes(data.interview.questionnaire.notes || "");
          }
        } else {
          setError("Interview not found");
        }
      } catch (err) {
        setError("Failed to load interview");
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      loadInterview();
    }
  }, [status]);

  const handleStartInterview = async () => {
    if (!interview) return;
    
    try {
      await fetch(`/api/interviews/${interview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" })
      });
      
      // Open video room in new tab
      window.open(interview.videoRoomUrl, "_blank");
      
      // Update local state
      setInterview({ ...interview, status: "IN_PROGRESS" });
    } catch (err) {
      setError("Failed to start interview");
    }
  };

  const handleCompleteInterview = async () => {
    if (!interview) return;
    
    try {
      await fetch(`/api/interviews/${interview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" })
      });
      
      setInterview({ ...interview, status: "COMPLETED" });
    } catch (err) {
      setError("Failed to complete interview");
    }
  };

  const handleSubmitQuestionnaire = async () => {
    if (!interview) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/interviews/${interview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionnaire: {
            communicationRating,
            experienceRating,
            punctualityRating,
            wouldRecommend,
            proceedWithContract,
            notes
          }
        })
      });

      if (response.ok) {
        router.push("/app/dashboard?interview=completed");
      } else {
        setError("Failed to submit questionnaire");
      }
    } catch (err) {
      setError("Failed to submit questionnaire");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-6 max-w-2xl">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </AppShell>
    );
  }

  if (!interview) {
    return (
      <AppShell>
        <Card className="border-destructive/20">
          <CardContent className="pt-6 text-center">
            <IconAlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t.error}</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button className="mt-4" onClick={() => router.push("/app/dashboard")}>
              {t.back}
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const isFamily = session?.user?.role === "FAMILY";
  const otherPartyName = isFamily ? interview.caregiverName : interview.familyName;

  const getStatusBadge = () => {
    switch (interview.status) {
      case "SCHEDULED":
        return <Badge variant="secondary">{t.kyc.status.pending}</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-green-500">{t.dashboard.status.active}</Badge>;
      case "COMPLETED":
        return <Badge className="bg-primary">{t.contracts.status.completed}</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">{t.contracts.status.cancelled}</Badge>;
      default:
        return null;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <IconVideo className="h-6 w-6" />
            Video Interview
          </h1>
          <p className="text-muted-foreground">
            {isFamily ? "Interview with" : "Interview from"} {otherPartyName}
          </p>
        </div>

        {/* Status Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <IconClock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {new Date(interview.scheduledAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(interview.scheduledAt).toLocaleTimeString()} • {interview.durationMinutes} min
                  </p>
                </div>
              </div>
              {getStatusBadge()}
            </div>

            {/* Actions based on status */}
            {interview.status === "SCHEDULED" && (
              <Button onClick={handleStartInterview} className="w-full">
                <IconVideo className="h-4 w-4 mr-2" />
                Start Interview
              </Button>
            )}

            {interview.status === "IN_PROGRESS" && (
              <div className="space-y-3">
                <Button variant="outline" onClick={() => window.open(interview.videoRoomUrl, "_blank")} className="w-full">
                  <IconVideo className="h-4 w-4 mr-2" />
                  Rejoin Interview
                </Button>
                <Button onClick={handleCompleteInterview} className="w-full">
                  <IconCheck className="h-4 w-4 mr-2" />
                  Mark as Completed
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Questionnaire (Family only, after interview) */}
        {isFamily && interview.status === "COMPLETED" && !interview.familyCompletedAt && (
          <Card>
            <CardHeader>
              <CardTitle>Post-Interview Questionnaire</CardTitle>
              <CardDescription>
                Please rate your interview experience with {interview.caregiverName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Communication Rating */}
              <div className="space-y-2">
                <Label>Communication</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[communicationRating]}
                    onValueChange={([value]) => setCommunicationRating(value)}
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1">
                    {Array.from({ length: communicationRating }).map((_, i) => (
                      <IconStar key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Experience Rating */}
              <div className="space-y-2">
                <Label>Experience & Qualifications</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[experienceRating]}
                    onValueChange={([value]) => setExperienceRating(value)}
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1">
                    {Array.from({ length: experienceRating }).map((_, i) => (
                      <IconStar key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Punctuality Rating */}
              <div className="space-y-2">
                <Label>Punctuality</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[punctualityRating]}
                    onValueChange={([value]) => setPunctualityRating(value)}
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1">
                    {Array.from({ length: punctualityRating }).map((_, i) => (
                      <IconStar key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="flex items-center justify-between">
                <Label>Would you recommend this caregiver?</Label>
                <Button
                  variant={wouldRecommend ? "default" : "outline"}
                  size="sm"
                  onClick={() => setWouldRecommend(!wouldRecommend)}
                >
                  {wouldRecommend ? <IconCheck className="h-4 w-4 mr-1" /> : null}
                  {wouldRecommend ? "Yes" : "No"}
                </Button>
              </div>

              {/* Proceed with Contract */}
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div>
                  <Label className="text-base font-semibold">Proceed with Contract?</Label>
                  <p className="text-sm text-muted-foreground">
                    Accepting confirms you want to hire this caregiver
                  </p>
                </div>
                <Button
                  variant={proceedWithContract ? "default" : "outline"}
                  onClick={() => setProceedWithContract(!proceedWithContract)}
                >
                  {proceedWithContract ? <IconCheck className="h-4 w-4 mr-1" /> : null}
                  {proceedWithContract ? "Yes, Proceed" : "Not Yet"}
                </Button>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Additional Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional observations about the interview..."
                  rows={3}
                />
              </div>

              {/* Submit */}
              <Button 
                onClick={handleSubmitQuestionnaire} 
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <IconCheck className="h-4 w-4 mr-2" />
                    Submit Questionnaire
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Already Completed */}
        {interview.familyCompletedAt && (
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6 text-center">
              <IconCheck className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h2 className="text-xl font-semibold text-green-600">Questionnaire Submitted</h2>
              <p className="text-muted-foreground mt-1">
                {proceedWithContract 
                  ? "The contract is now waiting for the caregiver's acceptance."
                  : "Your feedback has been recorded."
                }
              </p>
              <Button className="mt-4" onClick={() => router.push("/app/dashboard")}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-4">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
