import { CreateOrderModal } from '../CreateOrderModal'
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function CreateOrderModalExample() {
  return (
    <div className="p-6 bg-background">
      <CreateOrderModal 
        trigger={
          <Button className="bg-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Open Create Order Modal
          </Button>
        }
      />
    </div>
  )
}