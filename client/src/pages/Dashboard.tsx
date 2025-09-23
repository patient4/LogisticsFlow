import { MetricsCards } from "@/components/MetricsCards"
import { OrderActions } from "@/components/OrderActions"
import { OrdersTable } from "@/components/OrdersTable"

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">
          Order Management
        </h1>
      </div>
      
      <MetricsCards />
      <OrderActions />
      <OrdersTable />
    </div>
  )
}