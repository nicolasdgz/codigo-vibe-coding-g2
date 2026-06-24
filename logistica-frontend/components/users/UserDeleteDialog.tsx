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
import { useDeleteUser } from '@/hooks/users'

interface UserDeleteDialogProps {
  userId: number
  username: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function UserDeleteDialog({
  userId,
  username,
  open,
  onOpenChange,
  onDeleted,
}: UserDeleteDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const deleteUser = useDeleteUser()

  function handleConfirm() {
    setErrorMessage(null)
    deleteUser.mutate(userId, {
      onSuccess: () => {
        onOpenChange(false)
        onDeleted()
      },
      onError: (err) => {
        if (axios.isAxiosError(err)) {
          const detail = (err.response?.data as { detail?: string })?.detail
          setErrorMessage(detail ?? 'Ocurrió un error al eliminar el usuario.')
        } else {
          setErrorMessage('Ocurrió un error al eliminar el usuario.')
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
          <DialogTitle>Eliminar usuario</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que querés eliminar a{' '}
            <span className="font-medium text-foreground">{username}</span>?
            Esta acción no se puede deshacer.
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
            disabled={deleteUser.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteUser.isPending}
          >
            {deleteUser.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
