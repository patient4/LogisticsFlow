import { MetricsCards } from "@/components/MetricsCards"
import { OrderActions } from "@/components/OrderActions"
import { OrdersTable } from "@/components/OrdersTable"
import { CreateOrderModal } from "@/components/CreateOrderModal"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">
          Order Management
        </h1>
        <CreateOrderModal 
          trigger={
            <Button className="bg-primary text-primary-foreground" data-testid="button-create-order">
              <Plus className="w-4 h-4 mr-2" />
              Create Order
            </Button>
          }
        />
      </div>
      
      <MetricsCards />
      <OrderActions />
      <OrdersTable />
    </div>
  )
}