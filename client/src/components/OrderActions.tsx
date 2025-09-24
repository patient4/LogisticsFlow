import { Button } from "@/components/ui/button"
import { Plus, Filter, Download, Printer } from "lucide-react"

export function OrderActions() {

  const handleCreateNew = () => {
    console.log("Create new order triggered")
  }

  const handleFilter = () => {
    console.log("Filter triggered")
  }

  const handleExport = () => {
    console.log("Export triggered")
  }

  const handlePrint = () => {
    console.log("Print triggered")
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button 
        onClick={handleCreateNew}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
        data-testid="button-create-new"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create new
      </Button>
      <Button 
        variant="outline" 
        onClick={handleFilter}
        data-testid="button-filter"
      >
        <Filter className="w-4 h-4 mr-2" />
        Filter
      </Button>
      <Button 
        variant="outline" 
        onClick={handleExport}
        data-testid="button-export"
      >
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
      <Button 
        variant="outline" 
        onClick={handlePrint}
        data-testid="button-print"
      >
        <Printer className="w-4 h-4 mr-2" />
        Print
      </Button>
    </div>
  )
}