'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IconMoreVertical, IconEdit, IconCopy, IconLock, IconTrash } from '@/components/icons';

interface DemandActionsDropdownProps {
  demandId: string;
  demandTitle: string;
  onActionComplete?: () => void;
}

export function DemandActionsDropdown({
  demandId,
  demandTitle,
  onActionComplete,
}: DemandActionsDropdownProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [closeReason, setCloseReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = () => {
    router.push(`/app/family/demands/${demandId}/edit`);
  };

  const handleDuplicate = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/demands/${demandId}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to duplicate demand');
      }

      const data = await response.json();
      toast.success(`Demanda duplicada: "${data.title}"`);
      onActionComplete?.();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao duplicar demanda'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/demands/${demandId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closedReason: closeReason || undefined }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to close demand');
      }

      toast.success('Demanda fechada com sucesso');
      setIsCloseDialogOpen(false);
      setCloseReason('');
      onActionComplete?.();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao fechar demanda'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/demands/${demandId}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletionReason: deleteReason || undefined }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete demand');
      }

      toast.success('Demanda deletada com sucesso');
      setIsDeleteDialogOpen(false);
      setDeleteReason('');
      onActionComplete?.();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao deletar demanda'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <IconMoreVertical className="h-4 w-4" />
            <span className="sr-only">Abrir menu de ações</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleEdit} disabled={isLoading}>
            <IconEdit className="h-4 w-4 mr-2" />
            <span>Editar</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleDuplicate} disabled={isLoading}>
            <IconCopy className="h-4 w-4 mr-2" />
            <span>Duplicar</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setIsCloseDialogOpen(true)}
            disabled={isLoading}
          >
            <IconLock className="h-4 w-4 mr-2" />
            <span>Fechar</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isLoading}
            className="text-destructive focus:text-destructive"
          >
            <IconTrash className="h-4 w-4 mr-2" />
            <span>Deletar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Close Dialog */}
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Demanda</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja fechar a demanda "{demandTitle}"? Isso
              impedirá novos cuidadores de se candidatarem.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Motivo (opcional)
              </label>
              <textarea
                placeholder="Por que está fechando esta demanda?"
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter className="gap-3">
            <button
              onClick={() => setIsCloseDialogOpen(false)}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? 'Fechando...' : 'Fechar Demanda'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar Demanda</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar a demanda "{demandTitle}"? Esta
              ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Motivo da Exclusão (opcional)
              </label>
              <textarea
                placeholder="Por que está deletando esta demanda?"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter className="gap-3">
            <button
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {isLoading ? 'Deletando...' : 'Deletar Demanda'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
