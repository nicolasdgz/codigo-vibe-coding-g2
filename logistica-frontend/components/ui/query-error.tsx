import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QueryErrorProps {
  message: string
  onRetry?: () => void
}

export function QueryError({ message, onRetry }: QueryErrorProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <div className="flex items-center gap-2">
        <AlertCircle className="size-4 shrink-0" />
        <span>{message}</span>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="ml-4 shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
        >
          Reintentar
        </Button>
      )}
    </div>
  )
}
