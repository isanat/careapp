"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  IconStar,
  IconCheck,
  IconAlert,
  IconLoader2,
} from "@/components/icons";
import { Star } from "lucide-react";

interface ReviewSectionProps {
  contractId: string;
  caregiverUserId: string;
  currentUserId: string;
}

export function ReviewSection({ contractId, caregiverUserId, currentUserId }: ReviewSectionProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingReview, setIsCheckingReview] = useState(true);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Check if user has already left a review for this contract
  useEffect(() => {
    const checkExistingReview = async () => {
      try {
        const response = await fetch(
          `/api/reviews?contractId=${contractId}&fromUserId=${currentUserId}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.reviews && data.reviews.length > 0) {
            setHasReviewed(true);
          }
        }
      } catch (err) {
        console.error("Error checking existing review:", err);
      } finally {
        setIsCheckingReview(false);
      }
    };

    checkExistingReview();
  }, [contractId, currentUserId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Selecione uma classificação de 1 a 5 estrelas.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId,
          toUserId: caregiverUserId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao submeter avaliação");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Erro ao submeter avaliação");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Still checking if review exists
  if (isCheckingReview) {
    return null;
  }

  // User already left a review
  if (hasReviewed) {
    return null;
  }

  // Successfully submitted
  if (submitted) {
    return (
      <Card className="border-green-500">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <IconCheck className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="font-semibold text-lg">Avaliação Submetida</h3>
            <p className="text-sm text-muted-foreground">
              Obrigado pela sua avaliação! A sua opinião ajuda outros utilizadores.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayRating = hoveredRating || rating;

  return (
    <Card className="border-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconStar className="h-5 w-5 text-blue-500" />
          Avaliar Cuidador
        </CardTitle>
        <CardDescription>
          O contrato foi concluído. Deixe a sua avaliação sobre o serviço prestado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star Rating */}
        <div className="space-y-2">
          <Label>Classificação</Label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= displayRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
            {displayRating > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">
                {displayRating}/5
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <Label htmlFor="review-comment">Comentário (opcional)</Label>
          <Textarea
            id="review-comment"
            placeholder="Descreva a sua experiência com o cuidador..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground text-right">
            {comment.length}/1000
          </p>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <IconAlert className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={isSubmitting || rating === 0}
        >
          {isSubmitting ? (
            <>
              <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
              A submeter...
            </>
          ) : (
            <>
              <IconStar className="h-4 w-4 mr-2" />
              Submeter Avaliação
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
