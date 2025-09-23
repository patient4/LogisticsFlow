import { MetricsCards } from "@/components/MetricsCards"
import { OrderActions } from "@/components/OrderActions"
import { OrdersTable } from "@/components/OrdersTable"

export default function Orders() {
  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-6" data-testid="page-title">
          Orders
        </h1>
      </div>
      
      <MetricsCards />
      <OrderActions />
      <OrdersTable />
    </div>
  )
}