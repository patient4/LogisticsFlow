import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"

interface DashboardMetrics {
  totalOrders: number
  pendingOrders: number
  totalInTransit: number
  totalRevenue: string
}

interface MetricCardProps {
  title: string
  value: string | number
  testId: string
  isLoading: boolean
}

function MetricCard({ title, value, testId, isLoading }: MetricCardProps) {
  return (
    <Card className="bg-muted/50">
      <CardContent className="p-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground" data-testid={`${testId}-label`}>
            {title}
          </p>
          <p className="text-3xl font-bold text-foreground" data-testid={`${testId}-value`}>
            {isLoading ? "..." : value}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function MetricsCards() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
  })

  const metricsData = [
    { title: "Total Orders", value: metrics?.totalOrders || 0, testId: "metric-total-orders" },
    { title: "Pending Orders", value: metrics?.pendingOrders || 0, testId: "metric-pending-orders" },
    { title: "In Transit", value: metrics?.totalInTransit || 0, testId: "metric-in-transit" },
    { title: "Total Revenue", value: metrics?.totalRevenue ? `$${parseFloat(metrics.totalRevenue).toLocaleString()}` : "$0", testId: "metric-revenue" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metricsData.map((metric) => (
        <MetricCard
          key={metric.testId}
          title={metric.title}
          value={metric.value}
          testId={metric.testId}
          isLoading={isLoading}
        />
      ))}
    </div>
  )
}