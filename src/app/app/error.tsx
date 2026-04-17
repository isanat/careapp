"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BloomCard } from "@/components/bloom-custom/BloomCard";
import { IconAlert } from "@/components/icons";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="w-full max-w-md"
      >
        <BloomCard className="p-5 sm:p-6 md:p-7 text-center space-y-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <IconAlert className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-display font-bold uppercase text-foreground">
              Erro na aplicação
            </h1>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ocorreu um erro ao carregar esta página. Por favor, tente novamente.
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground font-mono">
                Ref: {error.digest}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button onClick={reset} className="rounded-2xl">
                Tentar novamente
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/app/dashboard")}
                className="rounded-2xl"
              >
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
        </BloomCard>
      </motion.div>
    </div>
  );
}
