import { MetricsCards } from "@/components/MetricsCards"
import { DispatchesTable } from "@/components/DispatchesTable"

export default function Dispatches() {
  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-6" data-testid="page-title">
          Dispatches
        </h1>
      </div>
      
      {/* Temporary: Reusing MetricsCards until we create DispatchMetricsCards */}
      <MetricsCards />
      
      {/* TODO: Create DispatchActions component */}
      <div className="bg-card rounded-lg p-4 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Dispatch Actions</h2>
        <p className="text-muted-foreground">Export dispatches, bulk operations, etc.</p>
      </div>
      
      {/* Dispatches Table */}
      <DispatchesTable />
    </div>
  )
}