'use client'

import { useState } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useDeleteGroup } from '@/hooks/users'

interface RoleDeleteDialogProps {
  groupId: number
  groupName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function RoleDeleteDialog({
  groupId,
  groupName,
  open,
  onOpenChange,
  onDeleted,
}: RoleDeleteDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const deleteGroup = useDeleteGroup()

  function handleConfirm() {
    setErrorMessage(null)
    deleteGroup.mutate(groupId, {
      onSuccess: () => {
        onOpenChange(false)
        onDeleted()
      },
      onError: (err) => {
        if (axios.isAxiosError(err)) {
          const detail = (err.response?.data as { detail?: string })?.detail
          setErrorMessage(detail ?? 'Ocurrió un error al eliminar el rol.')
        } else {
          setErrorMessage('Ocurrió un error al eliminar el rol.')
        }
      },
    })
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setErrorMessage(null)
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Eliminar rol</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que querés eliminar el rol{' '}
            <span className="font-medium text-foreground">{groupName}</span>?
            Los usuarios asignados a este rol perderán sus permisos asociados.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={deleteGroup.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteGroup.isPending}
          >
            {deleteGroup.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
