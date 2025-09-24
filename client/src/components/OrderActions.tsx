import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"

export function OrderActions() {

  const handleFilter = () => {
    console.log("Filter triggered")
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button 
        variant="outline" 
        onClick={handleFilter}
        data-testid="button-filter"
      >
        <Filter className="w-4 h-4 mr-2" />
        Filter
      </Button>
    </div>
  )
}