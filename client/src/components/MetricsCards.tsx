import { Card, CardContent } from "@/components/ui/card"

interface MetricCardProps {
  title: string
  value: string | number
  testId: string
}

function MetricCard({ title, value, testId }: MetricCardProps) {
  return (
    <Card className="bg-muted/50">
      <CardContent className="p-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground" data-testid={`${testId}-label`}>
            {title}
          </p>
          <p className="text-3xl font-bold text-foreground" data-testid={`${testId}-value`}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function MetricsCards() {
  // TODO: Remove mock data - replace with real metrics
  const metrics = [
    { title: "Total Orders", value: "4", testId: "metric-total-orders" },
    { title: "Pending Orders", value: "4", testId: "metric-pending-orders" },
    { title: "Total In Transit", value: "4", testId: "metric-in-transit" },
    { title: "Total Revenue", value: "4", testId: "metric-revenue" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.testId}
          title={metric.title}
          value={metric.value}
          testId={metric.testId}
        />
      ))}
    </div>
  )
}