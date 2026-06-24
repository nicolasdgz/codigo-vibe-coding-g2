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
import { useDeleteProduct } from '@/hooks/products'

interface ProductDeleteDialogProps {
  productId: number
  productName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function ProductDeleteDialog({
  productId,
  productName,
  open,
  onOpenChange,
  onDeleted,
}: ProductDeleteDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const deleteProduct = useDeleteProduct()

  function handleConfirm() {
    setErrorMessage(null)
    deleteProduct.mutate(productId, {
      onSuccess: () => {
        onOpenChange(false)
        onDeleted()
      },
      onError: (err) => {
        if (axios.isAxiosError(err)) {
          const detail = (err.response?.data as { detail?: string })?.detail
          setErrorMessage(
            detail ?? 'No se puede eliminar el producto porque está referenciado por ítems de envío existentes.'
          )
        } else {
          setErrorMessage('Ocurrió un error al eliminar el producto.')
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
          <DialogTitle>Eliminar producto</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que querés eliminar{' '}
            <span className="font-medium text-foreground">{productName}</span>?
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Si el producto está referenciado por ítems de envío, la eliminación será rechazada.
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
            disabled={deleteProduct.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteProduct.isPending}
          >
            {deleteProduct.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
