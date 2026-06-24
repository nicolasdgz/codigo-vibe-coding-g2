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
import { useDeleteCustomer } from '@/hooks/customers'

interface CustomerDeleteDialogProps {
  customerId: number
  customerName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function CustomerDeleteDialog({
  customerId,
  customerName,
  open,
  onOpenChange,
  onDeleted,
}: CustomerDeleteDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const deleteCustomer = useDeleteCustomer()

  function handleConfirm() {
    setErrorMessage(null)
    deleteCustomer.mutate(customerId, {
      onSuccess: () => {
        onOpenChange(false)
        onDeleted()
      },
      onError: (err) => {
        if (axios.isAxiosError(err)) {
          const detail = (err.response?.data as { detail?: string })?.detail
          setErrorMessage(detail ?? 'Ocurrió un error al eliminar el cliente.')
        } else {
          setErrorMessage('Ocurrió un error al eliminar el cliente.')
        }
      },
    })
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setErrorMessage(null)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Eliminar cliente</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que querés eliminar a{' '}
            <span className="font-medium text-foreground">{customerName}</span>?
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Si el cliente tiene envíos asociados, la eliminación será rechazada.
        </p>

        {errorMessage && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={deleteCustomer.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteCustomer.isPending}
          >
            {deleteCustomer.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
