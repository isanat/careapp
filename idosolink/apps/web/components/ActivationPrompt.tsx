'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle, ModalTrigger } from './ui/modal';

export const ActivationPrompt = () => {
  const [open, setOpen] = useState(false);

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        <Button variant="outline">Ativar conta €25</Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Ativar conta</ModalTitle>
          <ModalDescription>
            A ativação converte €25 em créditos para taxas e bônus, liberando o uso completo do IdosoLink.
          </ModalDescription>
        </ModalHeader>
        <Button asChild>
          <a href="/activation">Ir para ativação</a>
        </Button>
      </ModalContent>
    </Modal>
  );
};
