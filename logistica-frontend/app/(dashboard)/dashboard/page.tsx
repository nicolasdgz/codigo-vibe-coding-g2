import { KpiCards } from '@/components/dashboard/KpiCards'
import { ShipmentsStatusChart } from '@/components/dashboard/ShipmentsStatusChart'
import { ShipmentsTimeCharts } from '@/components/dashboard/ShipmentsTimeCharts'
import { RoutesStatusChart } from '@/components/dashboard/RoutesStatusChart'
import { VehiclesTypeChart } from '@/components/dashboard/VehiclesTypeChart'
import { LicensesExpiryChart } from '@/components/dashboard/LicensesExpiryChart'
import { StockByWarehouseChart } from '@/components/dashboard/StockByWarehouseChart'

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Bienvenido al sistema de gestión logística
        </p>
      </div>

      <KpiCards />

      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Envíos
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ShipmentsStatusChart />
          <ShipmentsTimeCharts />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Operaciones
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RoutesStatusChart />
          <VehiclesTypeChart />
        </div>
        <LicensesExpiryChart />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Inventario
        </h2>
        <StockByWarehouseChart />
      </section>
    </div>
  )
}
