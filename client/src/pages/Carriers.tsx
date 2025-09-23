import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"

export default function Carriers() {
  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">
          Carrier Management
        </h1>
        <Button className="bg-primary text-primary-foreground" data-testid="button-add-carrier">
          <Plus className="w-4 h-4 mr-2" />
          Add Carrier
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Carriers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground" data-testid="placeholder-text">
              Carrier management functionality will be implemented here.
              This includes carrier profiles, capacity information, and service areas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}