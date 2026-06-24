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
import { useDeleteTransport } from '@/hooks/transport'

interface TransportDeleteDialogProps {
  transportId: number
  plateNumber: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function TransportDeleteDialog({
  transportId,
  plateNumber,
  open,
  onOpenChange,
  onDeleted,
}: TransportDeleteDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const deleteTransport = useDeleteTransport()

  function handleConfirm() {
    setErrorMessage(null)
    deleteTransport.mutate(transportId, {
      onSuccess: () => {
        onOpenChange(false)
        onDeleted()
      },
      onError: (err) => {
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 400) {
            const detail = (err.response?.data as { detail?: string })?.detail
            setErrorMessage(
              detail ??
                'No se puede eliminar el vehículo porque está asignado a una ruta.'
            )
          } else {
            setErrorMessage('Ocurrió un error al eliminar el vehículo.')
          }
        } else {
          setErrorMessage('Ocurrió un error al eliminar el vehículo.')
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
          <DialogTitle>Eliminar vehículo</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que querés eliminar el vehículo{' '}
            <span className="font-medium text-foreground">{plateNumber}</span>?
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Si el vehículo está asignado a una ruta, la eliminación será rechazada.
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
            disabled={deleteTransport.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteTransport.isPending}
          >
            {deleteTransport.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
