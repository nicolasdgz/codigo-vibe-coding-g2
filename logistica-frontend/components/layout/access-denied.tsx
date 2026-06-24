'use client'

import { ShieldOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function AccessDenied() {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
      <ShieldOff className="size-12 text-muted-foreground" />
      <div>
        <h2 className="text-lg font-semibold">Sin acceso</h2>
        <p className="text-sm text-muted-foreground mt-1">
          No tenés permisos para ver esta sección.
        </p>
      </div>
      <Button variant="outline" onClick={() => router.push('/dashboard')}>
        Ir al inicio
      </Button>
    </div>
  )
}
