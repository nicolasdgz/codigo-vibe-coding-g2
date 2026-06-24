import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'

interface TableEmptyStateProps {
  colSpan: number
  hasActiveFilters: boolean
  entityName: string
  onClearFilters?: () => void
}

export function TableEmptyState({ colSpan, hasActiveFilters, entityName, onClearFilters }: TableEmptyStateProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-32 py-8 text-center">
        {hasActiveFilters ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <p className="text-sm">Sin resultados para los filtros aplicados.</p>
            {onClearFilters && (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No hay {entityName} todavía.</p>
        )}
      </TableCell>
    </TableRow>
  )
}
