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
import { useDeleteSupplier } from '@/hooks/suppliers'

interface SupplierDeleteDialogProps {
  supplierId: number
  supplierName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function SupplierDeleteDialog({
  supplierId,
  supplierName,
  open,
  onOpenChange,
  onDeleted,
}: SupplierDeleteDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const deleteSupplier = useDeleteSupplier()

  function handleConfirm() {
    setErrorMessage(null)
    deleteSupplier.mutate(supplierId, {
      onSuccess: () => {
        onOpenChange(false)
        onDeleted()
      },
      onError: (err) => {
        if (axios.isAxiosError(err)) {
          const detail = (err.response?.data as { detail?: string })?.detail
          setErrorMessage(detail ?? 'No se puede eliminar el proveedor con productos vinculados.')
        } else {
          setErrorMessage('Ocurrió un error al eliminar el proveedor.')
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
          <DialogTitle>Eliminar proveedor</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que querés eliminar{' '}
            <span className="font-medium text-foreground">{supplierName}</span>?
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Si el proveedor tiene productos asociados, la eliminación será rechazada.
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
            disabled={deleteSupplier.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteSupplier.isPending}
          >
            {deleteSupplier.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
