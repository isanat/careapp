"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { IconVideo, IconLoader2 } from "@/components/icons";

interface ScheduleInterviewDialogProps {
  caregiverUserId: string;
  caregiverName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleInterviewDialog({
  caregiverUserId,
  caregiverName,
  open,
  onOpenChange,
}: ScheduleInterviewDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scheduledAt || !scheduledTime) {
      toast({
        title: "Campos obrigatorios",
        description: "Por favor, selecione a data e hora da entrevista.",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time into ISO string
    const dateTime = new Date(`${scheduledAt}T${scheduledTime}:00`);
    if (isNaN(dateTime.getTime())) {
      toast({
        title: "Data invalida",
        description: "Por favor, selecione uma data e hora validas.",
        variant: "destructive",
      });
      return;
    }

    // Ensure the scheduled time is in the future
    if (dateTime <= new Date()) {
      toast({
        title: "Data invalida",
        description: "A entrevista deve ser agendada para o futuro.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caregiverUserId,
          scheduledAt: dateTime.toISOString(),
          durationMinutes: parseInt(durationMinutes, 10),
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao agendar entrevista");
      }

      toast({
        title: "Entrevista agendada!",
        description: `Entrevista com ${caregiverName} agendada para ${dateTime.toLocaleDateString("pt-PT")} as ${scheduledTime}.`,
      });

      onOpenChange(false);

      // Reset form
      setScheduledAt("");
      setScheduledTime("10:00");
      setDurationMinutes("30");
      setNotes("");

      // Redirect to interview page
      router.push(`/app/interview/${data.interview.id}`);
    } catch (error) {
      toast({
        title: "Erro ao agendar",
        description:
          error instanceof Error
            ? error.message
            : "Nao foi possivel agendar a entrevista. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconVideo className="h-5 w-5" />
            Agendar Entrevista
          </DialogTitle>
          <DialogDescription>
            Agende uma entrevista em video com {caregiverName}. Ambas as partes
            receberao um link para a videochamada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="interview-date">Data da Entrevista</Label>
            <Input
              id="interview-date"
              type="date"
              min={minDate}
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interview-time">Horario</Label>
            <Input
              id="interview-time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interview-duration">Duracao</Label>
            <Select value={durationMinutes} onValueChange={setDurationMinutes}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a duracao" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="60">60 minutos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interview-notes">
              Notas <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="interview-notes"
              placeholder="Adicione notas ou topicos que gostaria de discutir na entrevista..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Agendando...
                </>
              ) : (
                <>
                  <IconVideo className="h-4 w-4 mr-2" />
                  Agendar Entrevista
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
