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
import { useDeleteDriver } from '@/hooks/drivers'

interface DriverDeleteDialogProps {
  driverId: number
  driverName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function DriverDeleteDialog({
  driverId,
  driverName,
  open,
  onOpenChange,
  onDeleted,
}: DriverDeleteDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const deleteDriver = useDeleteDriver()

  function handleConfirm() {
    setErrorMessage(null)
    deleteDriver.mutate(driverId, {
      onSuccess: () => {
        onOpenChange(false)
        onDeleted()
      },
      onError: (err) => {
        if (axios.isAxiosError(err)) {
          const detail = (err.response?.data as { detail?: string })?.detail
          setErrorMessage(
            detail ?? 'No se puede eliminar el conductor porque está asignado a un vehículo.'
          )
        } else {
          setErrorMessage('Ocurrió un error al eliminar el conductor.')
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
          <DialogTitle>Eliminar conductor</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que querés eliminar{' '}
            <span className="font-medium text-foreground">{driverName}</span>?
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Si el conductor está asignado a un vehículo, la eliminación será rechazada.
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
            disabled={deleteDriver.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteDriver.isPending}
          >
            {deleteDriver.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
