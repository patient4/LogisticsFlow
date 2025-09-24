import { TrackingView } from "@/components/TrackingView"
import { useRoute } from "wouter"

export default function Tracking() {
  const [match, params] = useRoute("/tracking/:orderId?")
  const orderId = params?.orderId

  // Debug: Log route matching and orderId extraction
  console.log('Tracking page - Route match:', match, 'params:', params, 'orderId:', orderId)

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">
          Order Tracking
        </h1>
      </div>
      <TrackingView orderId={orderId} />
    </div>
  )
}