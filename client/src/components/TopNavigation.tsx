import { Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const navItems = [
  { label: "Order list", active: true, testId: "nav-tab-orders" },
  { label: "Tracking", active: false, testId: "nav-tab-tracking" },
  { label: "Dispatch", active: false, testId: "nav-tab-dispatch" },
  { label: "Costumer", active: false, testId: "nav-tab-costumer" },
  { label: "Carrier", active: false, testId: "nav-tab-carrier" },
]

export function TopNavigation() {
  return (
    <nav className="bg-sidebar border-b border-sidebar-border">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-4">
          {navItems.map((item, index) => (
            <Button
              key={item.label}
              variant={item.active ? "default" : "ghost"}
              size="sm"
              className={item.active ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}
              data-testid={item.testId}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-sidebar-foreground" data-testid="button-notifications">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-sidebar-foreground" data-testid="button-profile">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </nav>
  )
}