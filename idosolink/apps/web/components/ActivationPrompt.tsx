'use client';

import { useState } from 'react';
import { Modal } from './Modal';

export const ActivationPrompt = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-accent/60 px-5 py-2 text-accent"
      >
        Ativar conta €25
      </button>
      <Modal open={open} title="Ativar conta" onClose={() => setOpen(false)}>
        <p className="text-slate-300">
          A ativação converte €25 em tokens e libera acesso total ao marketplace.
        </p>
        <a
          href="/activation"
          className="w-full block text-center rounded-full bg-accent py-3 text-slate-900 font-semibold"
        >
          Ir para pagamento
        </a>
      </Modal>
    </>
  );
};
