import { TrackingTable } from "@/components/TrackingTable"

export default function Tracking() {
  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">
          Order Tracking
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor all order statuses, delivery progress, and manage tracking updates
        </p>
      </div>
      <TrackingTable />
    </div>
  )
}