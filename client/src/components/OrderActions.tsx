import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Filter, Download, Printer, Search } from "lucide-react"

export function OrderActions() {
  const [searchQuery, setSearchQuery] = useState("")

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

  const handleSearch = () => {
    console.log("Search triggered with query:", searchQuery)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
      <div className="flex flex-wrap gap-2">
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
      <div className="flex gap-2 items-center">
        <div className="relative">
          <Input
            type="search"
            placeholder="Enter search term..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 min-w-60"
            data-testid="input-search"
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-0 top-0 h-full px-3"
            onClick={handleSearch}
            data-testid="button-search"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
        <Select data-testid="select-order-filter">
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Order ID" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="order-id">Order ID</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="date">Date</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}