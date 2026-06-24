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
import { useDeleteShipment } from '@/hooks/shipments'

interface ShipmentDeleteDialogProps {
  shipmentId: number
  trackingNumber: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function ShipmentDeleteDialog({
  shipmentId,
  trackingNumber,
  open,
  onOpenChange,
  onDeleted,
}: ShipmentDeleteDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const deleteShipment = useDeleteShipment()

  function handleConfirm() {
    setErrorMessage(null)
    deleteShipment.mutate(shipmentId, {
      onSuccess: () => {
        onOpenChange(false)
        onDeleted()
      },
      onError: (err) => {
        if (axios.isAxiosError(err)) {
          const detail = (err.response?.data as { detail?: string })?.detail
          setErrorMessage(
            detail ??
              'No se puede eliminar el envío porque tiene items asociados o está en tránsito.'
          )
        } else {
          setErrorMessage(
            'No se puede eliminar el envío porque tiene items asociados o está en tránsito.'
          )
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
          <DialogTitle>Eliminar envío</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que querés eliminar el envío{' '}
            <span className="font-mono font-medium text-foreground">
              {trackingNumber}
            </span>
            ? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Todos los items del envío serán eliminados automáticamente.
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
            disabled={deleteShipment.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteShipment.isPending}
          >
            {deleteShipment.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
