/**
 * IdosoLink UI Kit - Modal Component
 * Accessible modal dialogs
 * Soft animations, clear focus
 */

"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Button } from "./button";

const Modal = DialogPrimitive.Root;
const ModalTrigger = DialogPrimitive.Trigger;
const ModalPortal = DialogPrimitive.Portal;
const ModalClose = DialogPrimitive.Close;

const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
ModalOverlay.displayName = DialogPrimitive.Overlay.displayName;

const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    size?: "sm" | "md" | "lg" | "xl" | "full";
  }
>(({ className, children, size = "md", ...props }, ref) => {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-4xl",
  };
  
  return (
    <ModalPortal>
      <ModalOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 w-[95%] translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-6 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </ModalPortal>
  );
});
ModalContent.displayName = DialogPrimitive.Content.displayName;

const ModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-2 text-center sm:text-left mb-6", className)}
    {...props}
  />
);
ModalHeader.displayName = "ModalHeader";

const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-xl font-semibold text-foreground", className)}
    {...props}
  />
));
ModalTitle.displayName = DialogPrimitive.Title.displayName;

const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-base text-muted-foreground", className)}
    {...props}
  />
));
ModalDescription.displayName = DialogPrimitive.Description.displayName;

const ModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 mt-6 pt-4 border-t", className)}
    {...props}
  />
);
ModalFooter.displayName = "ModalFooter";

// Pre-built Modal Variants

// Activation Modal
interface ActivationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

function ActivationModal({ open, onOpenChange, onConfirm, loading }: ActivationModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm">
        <ModalHeader>
          <ModalTitle>Ativar Conta</ModalTitle>
          <ModalDescription>
            Pague a taxa de ativação de €25 e receba 25 SENT tokens na sua carteira.
          </ModalDescription>
        </ModalHeader>
        
        <div className="bg-muted rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Taxa de ativação</span>
            <span className="font-semibold text-lg">€25,00</span>
          </div>
        </div>
        
        <ModalFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} loading={loading}>
            Pagar e Ativar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// Payment Modal
interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  description: string;
  onConfirm: () => void;
  loading?: boolean;
}

function PaymentModal({ open, onOpenChange, amount, description, onConfirm, loading }: PaymentModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm">
        <ModalHeader>
          <ModalTitle>Confirmar Pagamento</ModalTitle>
          <ModalDescription>{description}</ModalDescription>
        </ModalHeader>
        
        <div className="bg-muted rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Valor</span>
            <span className="font-bold text-2xl text-primary">€{amount.toFixed(2)}</span>
          </div>
        </div>
        
        <ModalFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} loading={loading}>
            Confirmar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// Tip Modal
function TipModal({ open, onOpenChange, caregiverName, onConfirm, loading }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caregiverName: string;
  onConfirm: (amount: number) => void;
  loading?: boolean;
}) {
  const [amount, setAmount] = React.useState(5);
  const presetAmounts = [5, 10, 20, 50];
  
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm">
        <ModalHeader>
          <ModalTitle>Enviar Gorjeta</ModalTitle>
          <ModalDescription>
            Recompense {caregiverName} pelo excelente trabalho
          </ModalDescription>
        </ModalHeader>
        
        <div className="grid grid-cols-4 gap-2 mb-4">
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset)}
              className={cn(
                "p-3 rounded-xl border-2 text-center transition-all",
                amount === preset
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border hover:border-primary/50"
              )}
            >
              €{preset}
            </button>
          ))}
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Ou insira um valor personalizado
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-12 pl-8 pr-4 rounded-xl border border-input focus:ring-2 focus:ring-primary focus:outline-none"
              min={1}
              max={500}
            />
          </div>
        </div>
        
        <ModalFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(amount)} loading={loading}>
            Enviar €{amount} em SENT
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export {
  Modal,
  ModalTrigger,
  ModalPortal,
  ModalClose,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ActivationModal,
  PaymentModal,
  TipModal,
};
